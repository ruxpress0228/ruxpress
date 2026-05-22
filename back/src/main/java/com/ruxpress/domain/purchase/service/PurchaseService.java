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
import com.ruxpress.domain.admin.entity.SystemSetting;
import com.ruxpress.domain.admin.repository.SystemSettingRepository;
import com.ruxpress.domain.balance.service.BalanceService;
import com.ruxpress.domain.notification.service.NotificationService;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import com.ruxpress.domain.purchase.dto.request.AdminPurchaseStatusRequest;
import com.ruxpress.domain.purchase.dto.request.AdminPurchaseWalletCreditRequest;
import com.ruxpress.domain.purchase.dto.request.PurchaseItemRequest;
import com.ruxpress.domain.purchase.dto.request.PurchaseRequestCreateRequest;
import com.ruxpress.domain.purchase.dto.response.PurchaseItemResponse;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PurchaseService {

    private static final String FEE_RATE_KEY = "fee_rate";
    private static final BigDecimal DEFAULT_FEE_RATE_PERCENT = new BigDecimal("12");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;
    private final JsonUtils jsonUtils;
    private final BalanceService balanceService;
    private final NotificationService notificationService;
    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;

    private BigDecimal currentFeeRatePercent() {
        return systemSettingRepository.findBySettingKey(FEE_RATE_KEY)
                .map(SystemSetting::getSettingValue)
                .map(v -> {
                    try {
                        return new BigDecimal(v);
                    } catch (NumberFormatException e) {
                        log.warn("fee_rate setting value '{}' is not a valid number, using default", v);
                        return DEFAULT_FEE_RATE_PERCENT;
                    }
                })
                .orElse(DEFAULT_FEE_RATE_PERCENT);
    }

    @Transactional
    public PurchaseRequestResponse createPurchaseRequest(Long userId, PurchaseRequestCreateRequest request) {
        PurchaseRequest saved = createAndPersistPurchaseRequest(userId, request);
        return toResponse(saved);
    }

    @Transactional
    public PurchaseRequestResponse createPurchaseRequest(Long userId, PurchaseRequestCreateRequest request,
            List<MultipartFile> files) {
        List<MultipartFile> fileList = files != null ? files : List.of();
        log.info("Purchase create (with files) start. userId={}, fileCount={}", userId, fileList.size());
        if (fileList.size() > FileStorageUtil.MAX_IMAGE_COUNT) {
            throw new BusinessException(ErrorCode.FILE_COUNT_EXCEEDED);
        }

        PurchaseRequest entity = createAndPersistPurchaseRequest(userId, request);

        if (!fileList.isEmpty()) {
            saveAttachments(entity.getId(), fileList);
        }

        log.info("Purchase create (with files) done. userId={}, purchaseId={}", userId, entity.getId());
        return toResponse(entity);
    }

    private PurchaseRequest createAndPersistPurchaseRequest(Long userId, PurchaseRequestCreateRequest request) {
        request.isValid();
        PurchaseRequestStatus effectiveStatus = request.getStatus() != null
                ? request.getStatus()
                : PurchaseRequestStatus.DRAFT;

        // items 가 있으면 URL별 단가·수량 모델을 신뢰값으로 사용. 없으면 레거시 priceKrw 단일 사용.
        boolean hasItems = request.getItems() != null && !request.getItems().isEmpty();
        BigDecimal priceKrw;
        Integer quantity;
        String urlsJson;
        if (hasItems) {
            BigDecimal sumPrice = BigDecimal.ZERO;
            int sumQty = 0;
            for (PurchaseItemRequest item : request.getItems()) {
                BigDecimal unit = item.getPriceKrw() != null ? item.getPriceKrw() : BigDecimal.ZERO;
                int q = item.getQuantity() != null ? item.getQuantity() : 0;
                sumPrice = sumPrice.add(unit.multiply(BigDecimal.valueOf(q)));
                sumQty += q;
            }
            priceKrw = sumPrice;
            quantity = sumQty > 0 ? sumQty : 1;
            urlsJson = jsonUtils.toJson(request.getItems());
        } else {
            priceKrw = request.getPriceKrw() != null ? request.getPriceKrw() : BigDecimal.ZERO;
            quantity = request.getQuantity();
            urlsJson = jsonUtils.toJson(request.getUrls());
        }

        // 수수료·총액은 클라이언트 값이 아니라 서버측 SystemSetting(fee_rate)으로 재계산한 신뢰값을 저장한다.
        BigDecimal feeRatePercent = currentFeeRatePercent();
        BigDecimal feeAmount = priceKrw.multiply(feeRatePercent)
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal totalAmountKrw = priceKrw.add(feeAmount);

        String requestNumber = IDGenerateUtil.generatePurchaseRequestNumber();
        PurchaseRequest purchaseRequest = PurchaseRequest.create(
                userId,
                requestNumber,
                request.getProductName(),
                quantity,
                urlsJson,
                jsonUtils.toJson(request.getOptions()),
                request.getPriceRub(),
                priceKrw,
                request.getExchangeRateId(),
                feeAmount,
                totalAmountKrw,
                request.getMemo(),
                effectiveStatus);
        PurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
        if (effectiveStatus == PurchaseRequestStatus.SUBMITTED) {
            balanceService.debitForPurchase(userId, totalAmountKrw, saved.getId());
            saved.recordChargedAmount(totalAmountKrw);
            saved = purchaseRequestRepository.save(saved);
        }
        return saved;
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

        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(),
                page.getSize());
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
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(),
                page.getSize());
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

    private void saveAttachments(Long purchaseId, List<MultipartFile> files) {
        String directory = ModulePrefix.PURCHASE;
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            try {
                log.info(
                        "Purchase attachment upload start. purchaseId={}, idx={}, filename={}, sizeBytes={}, contentType={}",
                        purchaseId, i, file.getOriginalFilename(), file.getSize(), file.getContentType());
                String storedUrl = fileStoragePort.store(directory, file);
                log.info("Purchase attachment upload done. purchaseId={}, idx={}, storedUrl={}", purchaseId, i,
                        storedUrl);
                Attachment attachment = Attachment.create(
                        AttachmentRefType.PURCHASE,
                        purchaseId,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        i);
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                log.error("Purchase attachment upload failed. purchaseId={}, idx={}", purchaseId, i, e);
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestResponse> getAdminPurchaseRequests(
            PurchaseRequestStatus status, String userKeyword, Pageable pageable) {
        Page<PurchaseRequest> page;
        if (userKeyword != null && !userKeyword.isBlank()) {
            List<Long> matchedUserIds = userRepository
                    .searchByKeyword(userKeyword.trim(), Pageable.unpaged())
                    .getContent()
                    .stream()
                    .map(User::getId)
                    .toList();
            if (matchedUserIds.isEmpty()) {
                return new PageResponse<>(List.of(), 0, 0, pageable.getPageNumber(), pageable.getPageSize());
            }
            page = status == null
                    ? purchaseRequestRepository.findByUserIdInAndDeletedAtIsNull(matchedUserIds, pageable)
                    : purchaseRequestRepository.findByUserIdInAndStatusAndDeletedAtIsNull(matchedUserIds, status, pageable);
        } else {
            page = status == null
                    ? purchaseRequestRepository.findByDeletedAtIsNull(pageable)
                    : purchaseRequestRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        }

        // 페이지 내 user_id 들을 한 번에 모아 user 정보를 IN 조회 — N+1 회피.
        List<Long> userIds = page.getContent().stream()
                .map(PurchaseRequest::getUserId)
                .distinct()
                .toList();
        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(u -> userMap.put(u.getId(), u));
        }

        List<PurchaseRequestResponse> content = page.getContent().stream()
                .map(pr -> toResponseWithUser(pr, userMap.get(pr.getUserId())))
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(),
                page.getSize());
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getAdminPurchaseRequestDetail(Long id) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        User user = userRepository.findById(pr.getUserId()).orElse(null);
        return toResponseWithUser(pr, user);
    }

    @Transactional
    public PurchaseRequestResponse updatePurchaseRequestStatus(Long id, Long adminId,
            AdminPurchaseStatusRequest request) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        pr.changeStatus(request.getStatus());
        pr.updateAdminMemo(request.getAdminMemo());
        pr.updateTrackingNumber(request.getTrackingNumber());
        if (adminId != null) {
            pr.assignAdmin(adminId);
        }
        PurchaseRequest saved = purchaseRequestRepository.save(pr);

        if (request.getStatus() == PurchaseRequestStatus.REFUNDED) {
            balanceService.creditForPurchaseRefund(saved.getUserId(), saved.getId());
        }

        return toResponse(saved);
    }

    /** 관리자 첨부 업로드는 일부 배송 관련 상태에서만 허용. */
    private static final java.util.Set<PurchaseRequestStatus> ADMIN_UPLOAD_ALLOWED_STATUSES =
            java.util.EnumSet.of(
                    PurchaseRequestStatus.PURCHASED,
                    PurchaseRequestStatus.SHIPPING,
                    PurchaseRequestStatus.DELIVERED);

    @Transactional
    public PurchaseRequestResponse uploadAdminAttachments(Long id, List<MultipartFile> files) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        if (!ADMIN_UPLOAD_ALLOWED_STATUSES.contains(pr.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_PURCHASE_STATE,
                    "관리자 첨부는 PURCHASED, SHIPPING, DELIVERED 상태에서만 가능합니다.");
        }
        List<MultipartFile> fileList = files != null ? files : List.of();
        if (fileList.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "업로드할 파일이 없습니다.");
        }
        if (fileList.size() > FileStorageUtil.MAX_IMAGE_COUNT) {
            throw new BusinessException(ErrorCode.FILE_COUNT_EXCEEDED);
        }

        int baseSortOrder = attachmentRepository
                .findByRefTypeAndRefIdOrderBySortOrder(AttachmentRefType.PURCHASE, pr.getId())
                .size();
        String directory = ModulePrefix.PURCHASE;
        for (int i = 0; i < fileList.size(); i++) {
            MultipartFile file = fileList.get(i);
            FileStorageUtil.validateImageOrThrow(file);
            try {
                String storedUrl = fileStoragePort.store(directory, file);
                Attachment attachment = Attachment.createByAdmin(
                        AttachmentRefType.PURCHASE,
                        pr.getId(),
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        baseSortOrder + i);
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                log.error("Admin purchase attachment upload failed. purchaseId={}, idx={}", pr.getId(), i, e);
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }

        User user = userRepository.findById(pr.getUserId()).orElse(null);
        return toResponseWithUser(pr, user);
    }

    @Transactional
    public PurchaseRequestResponse creditPurchaseWalletAdjustment(
            Long id,
            Long adminId,
            AdminPurchaseWalletCreditRequest request) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        if (adminId != null) {
            pr.assignAdmin(adminId);
        }
        pr.recordSettledAmount(request.getSettledAmountKrw());
        if (request.getAdminMemo() != null && !request.getAdminMemo().isBlank()) {
            pr.updateAdminMemo(request.getAdminMemo());
        }
        purchaseRequestRepository.save(pr);

        String memo = request.getAdminMemo();
        balanceService.creditPurchaseAdjustment(
                pr.getUserId(),
                pr.getId(),
                request.getAmount(),
                request.getIdempotencyKey(),
                memo);

        notificationService.notifyWalletPurchaseAdjustment(
                pr.getUserId(),
                pr.getId(),
                request.getAmount());

        return toResponse(purchaseRequestRepository.findById(id).orElse(pr));
    }

    private PurchaseRequestListResponse toListResponse(PurchaseRequest entity) {
        return new PurchaseRequestListResponse(
                entity.getId(),
                entity.getRequestNumber(),
                entity.getProductName(),
                entity.getQuantity(),
                entity.getTotalAmountKrw(),
                entity.getChargedAmountKrw(),
                entity.getSettledAmountKrw(),
                entity.getStatus(),
                entity.getCreatedAt());
    }

    private PurchaseRequestResponse toResponse(PurchaseRequest entity) {
        return toResponseWithUser(entity, null);
    }

    private PurchaseRequestResponse toResponseWithUser(PurchaseRequest entity, User user) {
        List<Attachment> attachments = attachmentRepository.findByRefTypeAndRefIdOrderBySortOrder(
                AttachmentRefType.PURCHASE,
                entity.getId());
        List<AttachmentResponse> attachmentResponses = attachments.stream()
                .map(a -> new AttachmentResponse(
                        a.getId(),
                        a.getOriginalFilename(),
                        a.getStoredUrl(),
                        a.getThumbnailUrl(),
                        fileStoragePort.getViewUrl(a.getStoredUrl()),
                        a.getFileSize(),
                        a.getMimeType(),
                        a.isUploadedByAdmin()))
                .collect(Collectors.toList());

        // urls JSON 컬럼은 (1) 신규 [{url, shop?, priceKrw, quantity}, ...] 또는 (2) 레거시 ["string", ...] 두 형식 모두 지원.
        List<String> urlsList = new java.util.ArrayList<>();
        List<PurchaseItemResponse> itemsList = new java.util.ArrayList<>();
        var node = jsonUtils.parseJsonNode(entity.getUrls());
        if (node != null && node.isArray()) {
            for (var element : node) {
                if (element.isObject()) {
                    String url = element.path("url").asText(null);
                    String shop = element.path("shop").asText(null);
                    java.math.BigDecimal priceKrw = element.has("priceKrw") && !element.get("priceKrw").isNull()
                            ? new java.math.BigDecimal(element.get("priceKrw").asText())
                            : null;
                    Integer qty = element.has("quantity") && !element.get("quantity").isNull()
                            ? element.get("quantity").asInt()
                            : null;
                    itemsList.add(new PurchaseItemResponse(url, shop, priceKrw, qty));
                    if (url != null && !url.isBlank()) {
                        urlsList.add(url);
                    }
                } else if (element.isTextual()) {
                    urlsList.add(element.asText());
                }
            }
        }

        return new PurchaseRequestResponse(
                entity.getId(),
                entity.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getNickname() : null,
                entity.getRequestNumber(),
                entity.getProductName(),
                entity.getQuantity(),
                urlsList,
                jsonUtils.parseJsonNode(entity.getOptions()),
                entity.getPriceRub(),
                entity.getPriceKrw(),
                entity.getExchangeRateId(),
                entity.getFeeAmount(),
                entity.getTotalAmountKrw(),
                entity.getChargedAmountKrw(),
                entity.getSettledAmountKrw(),
                entity.getMemo(),
                entity.getStatus(),
                entity.getAdminMemo(),
                entity.getAssignedAdminId(),
                entity.getTrackingNumber(),
                itemsList,
                attachmentResponses,
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
