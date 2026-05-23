package com.ruxpress.domain.banktransfer.service;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStorageUtil;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.util.ModulePrefix;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 계좌이체 페이지 공통 안내 이미지 (전역). refId = 0 sentinel 사용.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BankTransferNoticeService {

    private static final Long GLOBAL_REF_ID = 0L;
    private static final int MAX_NOTICE_IMAGES = 20;

    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;

    @Transactional(readOnly = true)
    public List<AttachmentResponse> list() {
        return attachmentRepository
                .findByRefTypeAndRefIdOrderBySortOrder(AttachmentRefType.BANK_TRANSFER_NOTICE, GLOBAL_REF_ID)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<AttachmentResponse> upload(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "업로드할 파일이 없습니다.");
        }
        List<Attachment> existing = attachmentRepository
                .findByRefTypeAndRefIdOrderBySortOrder(AttachmentRefType.BANK_TRANSFER_NOTICE, GLOBAL_REF_ID);
        if (existing.size() + files.size() > MAX_NOTICE_IMAGES) {
            throw new BusinessException(ErrorCode.INVALID_INPUT,
                    "안내 이미지는 최대 " + MAX_NOTICE_IMAGES + "개까지 등록할 수 있습니다.");
        }

        int baseSortOrder = existing.stream().mapToInt(Attachment::getSortOrder).max().orElse(-1) + 1;
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            FileStorageUtil.validateImageOrThrow(file);
            try {
                String storedUrl = fileStoragePort.store(ModulePrefix.BANK_TRANSFER_NOTICE, file);
                Attachment attachment = Attachment.createByAdmin(
                        AttachmentRefType.BANK_TRANSFER_NOTICE,
                        GLOBAL_REF_ID,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        baseSortOrder + i);
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                log.error("Bank transfer notice upload failed. idx={}", i, e);
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }
        return list();
    }

    @Transactional
    public void delete(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "이미지를 찾을 수 없습니다."));
        if (attachment.getRefType() != AttachmentRefType.BANK_TRANSFER_NOTICE) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "안내 이미지가 아닙니다.");
        }
        attachmentRepository.delete(attachment);
    }

    private AttachmentResponse toResponse(Attachment a) {
        return new AttachmentResponse(
                a.getId(),
                a.getOriginalFilename(),
                a.getStoredUrl(),
                a.getThumbnailUrl(),
                fileStoragePort.getViewUrl(a.getStoredUrl()),
                a.getFileSize(),
                a.getMimeType(),
                a.isUploadedByAdmin());
    }
}
