package com.ruxpress.domain.banktransfer.service;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BankTransferNoticeService {

    private static final AttachmentRefType REF_TYPE = AttachmentRefType.BANK_TRANSFER_NOTICE;
    private static final Long REF_ID = 0L;

    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;

    @Transactional(readOnly = true)
    public List<AttachmentResponse> list() {
        return attachmentRepository.findByRefTypeAndRefIdOrderBySortOrder(REF_TYPE, REF_ID)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AttachmentResponse> upload(List<MultipartFile> files) {
        int baseOrder = attachmentRepository.findByRefTypeAndRefIdOrderBySortOrder(REF_TYPE, REF_ID).size();
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            try {
                String storedUrl = fileStoragePort.store("bank-transfer-notice", file);
                Attachment attachment = Attachment.createByAdmin(
                        REF_TYPE,
                        REF_ID,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "notice",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        baseOrder + i
                );
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }
        return list();
    }

    public void delete(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (attachment.getRefType() != REF_TYPE) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        fileStoragePort.delete(attachment.getStoredUrl());
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
                a.isUploadedByAdmin()
        );
    }
}
