package com.ruxpress.domain.purchase.service;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.storage.FileStorageUtil;
import com.ruxpress.common.util.IDGenerateUtil;
import com.ruxpress.common.util.JsonUtils;
import com.ruxpress.common.util.ModulePrefix;
import com.ruxpress.domain.purchase.dto.request.PurchaseRequestCreateRequest;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestListResponse;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequest;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.domain.purchase.repository.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PurchaseService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;
    private final JsonUtils jsonUtils;

    @Transactional
    public PurchaseRequestResponse createPurchaseRequest(Long userId, PurchaseRequestCreateRequest request) {
        PurchaseRequest entity = saveEntity(userId, request);
        return toResponse(entity);
    }

    @Transactional
    public PurchaseRequestResponse createPurchaseRequest(Long userId, PurchaseRequestCreateRequest request, List<MultipartFile> files) {
        List<MultipartFile> fileList = files != null ? files : List.of();
        log.info("Purchase create (with files) start. userId={}, fileCount={}", userId, fileList.size());
        if (fileList.size() > FileStorageUtil.MAX_IMAGE_COUNT) {
            throw new BusinessException(ErrorCode.FILE_COUNT_EXCEEDED);
        }

        PurchaseRequest entity = saveEntity(userId, request);

        if (!fileList.isEmpty()) {
            saveAttachments(entity.getId(), fileList);
        }

        log.info("Purchase create (with files) done. userId={}, purchaseId={}", userId, entity.getId());
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestListResponse> getMyPurchaseRequests(
            Long userId,
            PurchaseRequestStatus status,
            Pageable pageable) {
        Page<PurchaseRequest> page = status == null
                ? purchaseRequestRepository.findByUserIdAndDeletedAtIsNull(userId, pageable)
                : purchaseRequestRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, status, pageable);

        List<PurchaseRequestListResponse> content = page.getContent().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestListResponse> getAllPurchaseRequests(
            PurchaseRequestStatus status,
            Pageable pageable) {
        Page<PurchaseRequest> page = status == null
                ? purchaseRequestRepository.findByDeletedAtIsNull(pageable)
                : purchaseRequestRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        List<PurchaseRequestListResponse> content = page.getContent().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestListResponse> getRecentMyPurchaseRequests(Long userId) {
        return purchaseRequestRepository.findTop3ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getPurchaseRequestById(Long purchaseRequestId) {
        PurchaseRequest entity = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (entity.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getMyPurchaseRequest(Long userId, Long purchaseRequestId) {
        PurchaseRequest entity = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (entity.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Resource getAttachmentResource(Long userId, Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (attachment.getRefType() != AttachmentRefType.PURCHASE) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        PurchaseRequest entity = purchaseRequestRepository.findById(attachment.getRefId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return fileStoragePort.loadAsResource(attachment.getStoredUrl());
    }

    @Transactional(readOnly = true)
    public String getAttachmentOriginalFilename(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (attachment.getRefType() != AttachmentRefType.PURCHASE) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return attachment.getOriginalFilename();
    }

    private PurchaseRequest saveEntity(Long userId, PurchaseRequestCreateRequest request) {
        String requestNumber = IDGenerateUtil.generatePurchaseRequestNumber();
        PurchaseRequest entity = PurchaseRequest.create(
                userId,
                requestNumber,
                request.getProductName(),
                request.getQuantity(),
                jsonUtils.toJson(request.getUrls()),
                jsonUtils.toJson(request.getOptions()),
                request.getPriceRub(),
                request.getPriceKrw(),
                request.getExchangeRateId(),
                request.getFeeAmount(),
                request.getTotalAmountKrw(),
                request.getMemo(),
                request.getStatus());
        return purchaseRequestRepository.save(entity);
    }

    private void saveAttachments(Long purchaseId, List<MultipartFile> files) {
        String directory = ModulePrefix.PURCHASE;
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            try {
                log.info("Purchase attachment upload start. purchaseId={}, idx={}, filename={}, sizeBytes={}, contentType={}",
                        purchaseId, i, file.getOriginalFilename(), file.getSize(), file.getContentType());
                String storedUrl = fileStoragePort.store(directory, file);
                log.info("Purchase attachment upload done. purchaseId={}, idx={}, storedUrl={}", purchaseId, i, storedUrl);
                Attachment attachment = Attachment.create(
                        AttachmentRefType.PURCHASE,
                        purchaseId,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        i
                );
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                log.error("Purchase attachment upload failed. purchaseId={}, idx={}", purchaseId, i, e);
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }
    }

    private PurchaseRequestListResponse toListResponse(PurchaseRequest entity) {
        return new PurchaseRequestListResponse(
                entity.getId(),
                entity.getRequestNumber(),
                entity.getProductName(),
                entity.getQuantity(),
                entity.getTotalAmountKrw(),
                entity.getStatus(),
                entity.getCreatedAt());
    }

    private PurchaseRequestResponse toResponse(PurchaseRequest entity) {
        List<Attachment> attachments = attachmentRepository.findByRefTypeAndRefIdOrderBySortOrder(
                AttachmentRefType.PURCHASE,
                entity.getId()
        );
        List<AttachmentResponse> attachmentResponses = attachments.stream()
                .map(a -> new AttachmentResponse(
                        a.getId(),
                        a.getOriginalFilename(),
                        a.getStoredUrl(),
                        a.getThumbnailUrl(),
                        fileStoragePort.getViewUrl(a.getStoredUrl()),
                        a.getFileSize(),
                        a.getMimeType()
                ))
                .collect(Collectors.toList());
        return new PurchaseRequestResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getRequestNumber(),
                entity.getProductName(),
                entity.getQuantity(),
                jsonUtils.parseStrings(entity.getUrls()),
                jsonUtils.parseJsonNode(entity.getOptions()),
                entity.getPriceRub(),
                entity.getPriceKrw(),
                entity.getExchangeRateId(),
                entity.getFeeAmount(),
                entity.getTotalAmountKrw(),
                entity.getMemo(),
                entity.getStatus(),
                entity.getAdminMemo(),
                entity.getAssignedAdminId(),
                attachmentResponses,
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
