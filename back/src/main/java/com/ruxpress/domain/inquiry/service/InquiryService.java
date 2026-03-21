package com.ruxpress.domain.inquiry.service;

import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.inquiry.dto.request.InquiryCreateRequest;
import com.ruxpress.domain.inquiry.dto.response.AdminInquiryListResponse;
import com.ruxpress.domain.inquiry.dto.response.InquiryListResponse;
import com.ruxpress.domain.inquiry.dto.response.InquiryReplyResponse;
import com.ruxpress.domain.inquiry.dto.response.InquiryResponse;
import com.ruxpress.domain.inquiry.entity.Inquiry;
import com.ruxpress.domain.inquiry.entity.InquiryReply;
import com.ruxpress.domain.inquiry.entity.InquiryStatus;
import com.ruxpress.domain.inquiry.repository.InquiryReplyRepository;
import com.ruxpress.domain.inquiry.repository.InquiryRepository;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private static final int MAX_FILE_COUNT = 5;
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB

    private final InquiryRepository inquiryRepository;
    private final InquiryReplyRepository inquiryReplyRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;

    @Transactional
    public InquiryResponse createInquiry(Long userId, InquiryCreateRequest request,
                                        List<MultipartFile> files) {
        List<MultipartFile> fileList = files != null ? files : List.of();
        if (fileList.size() > MAX_FILE_COUNT) {
            throw new BusinessException(ErrorCode.FILE_COUNT_EXCEEDED);
        }
        for (MultipartFile file : fileList) {
            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
            }
        }

        Inquiry inquiry = Inquiry.create(
                userId,
                request.getCategory(),
                request.getTitle(),
                request.getContent()
        );
        inquiry = inquiryRepository.save(inquiry);

        String directory = "inquiry/" + inquiry.getId();
        for (int i = 0; i < fileList.size(); i++) {
            MultipartFile file = fileList.get(i);
            try {
                String storedUrl = fileStoragePort.store(directory, file);
                Attachment attachment = Attachment.create(
                        AttachmentRefType.INQUIRY,
                        inquiry.getId(),
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        i
                );
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }

        return toDetailResponse(inquiry);
    }

    @Transactional(readOnly = true)
    public PageResponse<InquiryListResponse> getMyInquiries(Long userId, Pageable pageable) {
        Page<Inquiry> page = inquiryRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable);
        List<InquiryListResponse> content = page.getContent().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    @Transactional(readOnly = true)
    public InquiryResponse getInquiryDetail(Long userId, Long inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        if (!inquiry.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        }
        return toDetailResponse(inquiry);
    }

    @Transactional(readOnly = true)
    public Resource getAttachmentResource(Long attachmentId, Long userId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (attachment.getRefType() != AttachmentRefType.INQUIRY) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        Inquiry inquiry = inquiryRepository.findById(attachment.getRefId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        if (!inquiry.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.INQUIRY_ACCESS_DENIED);
        }
        return fileStoragePort.loadAsResource(attachment.getStoredUrl());
    }

    @Transactional(readOnly = true)
    public String getAttachmentOriginalFilename(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return attachment.getOriginalFilename();
    }

    // ─── Admin methods ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<AdminInquiryListResponse> getAllInquiriesForAdmin(Pageable pageable) {
        Page<Inquiry> page = inquiryRepository.findByDeletedAtIsNullOrderByCreatedAtDesc(pageable);
        List<AdminInquiryListResponse> content = page.getContent().stream()
                .map(this::toAdminListResponse)
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional(readOnly = true)
    public InquiryResponse getInquiryDetailForAdmin(Long inquiryId) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryResponse addAdminReply(Long adminId, Long inquiryId, String replyContent) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        if (inquiry.getStatus() == InquiryStatus.CLOSED) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        InquiryReply reply = InquiryReply.create(inquiry, adminId, replyContent);
        inquiryReplyRepository.save(reply);
        inquiry.markAsReplied();
        inquiryRepository.save(inquiry);
        return toDetailResponse(inquiry);
    }

    @Transactional
    public InquiryResponse updateAdminReply(Long inquiryId, Long replyId, String newContent) {
        InquiryReply reply = inquiryReplyRepository.findById(replyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!reply.getInquiry().getId().equals(inquiryId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        reply.updateContent(newContent);
        inquiryReplyRepository.save(reply);
        return toDetailResponse(reply.getInquiry());
    }

    @Transactional
    public InquiryResponse deleteAdminReply(Long inquiryId, Long replyId) {
        InquiryReply reply = inquiryReplyRepository.findById(replyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!reply.getInquiry().getId().equals(inquiryId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        reply.markDeleted();
        inquiryReplyRepository.save(reply);
        return toDetailResponse(reply.getInquiry());
    }

    @Transactional
    public InquiryResponse changeInquiryStatus(Long inquiryId, InquiryStatus newStatus) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        inquiry.changeStatus(newStatus);
        inquiryRepository.save(inquiry);
        return toDetailResponse(inquiry);
    }

    private AdminInquiryListResponse toAdminListResponse(Inquiry inquiry) {
        List<InquiryReply> replies = inquiryReplyRepository.findByInquiry_IdAndDeletedAtIsNullOrderByCreatedAtAsc(inquiry.getId());
        User user = userRepository.findById(inquiry.getUserId()).orElse(null);
        String nickname = user != null ? user.getNickname() : null;
        String email = user != null ? user.getEmail() : null;
        return new AdminInquiryListResponse(
                inquiry.getId(), inquiry.getUserId(), nickname, email,
                inquiry.getCategory(), inquiry.getTitle(),
                inquiry.getStatus(), replies.size(),
                replies.stream().anyMatch(r -> !r.isRead()), inquiry.getCreatedAt());
    }

    private InquiryListResponse toListResponse(Inquiry inquiry) {
        List<InquiryReply> replies = inquiryReplyRepository.findByInquiry_IdAndDeletedAtIsNullOrderByCreatedAtAsc(inquiry.getId());
        int replyCount = replies.size();
        boolean hasUnreadReply = replies.stream().anyMatch(r -> !r.isRead());
        return new InquiryListResponse(
                inquiry.getId(),
                inquiry.getCategory(),
                inquiry.getTitle(),
                inquiry.getStatus(),
                replyCount,
                hasUnreadReply,
                inquiry.getCreatedAt()
        );
    }

    private InquiryResponse toDetailResponse(Inquiry inquiry) {
        List<InquiryReply> replies = inquiryReplyRepository.findByInquiry_IdAndDeletedAtIsNullOrderByCreatedAtAsc(inquiry.getId());
        List<InquiryReplyResponse> replyResponses = replies.stream()
                .map(r -> new InquiryReplyResponse(
                        r.getId(),
                        r.getAdminId(),
                        r.getContent(),
                        r.isRead(),
                        r.getCreatedAt()
                ))
                .collect(Collectors.toList());
        List<Attachment> attachments = attachmentRepository.findByRefTypeAndRefIdOrderBySortOrder(AttachmentRefType.INQUIRY, inquiry.getId());
        List<AttachmentResponse> attachmentResponses = attachments.stream()
                .map(a -> new AttachmentResponse(
                        a.getId(),
                        a.getOriginalFilename(),
                        a.getStoredUrl(),
                        a.getThumbnailUrl(),
                        a.getFileSize(),
                        a.getMimeType()
                ))
                .collect(Collectors.toList());
        User user = userRepository.findById(inquiry.getUserId()).orElse(null);
        String nickname = user != null ? user.getNickname() : null;
        String email = user != null ? user.getEmail() : null;
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getUserId(),
                nickname,
                email,
                inquiry.getCategory(),
                inquiry.getTitle(),
                inquiry.getContent(),
                inquiry.getStatus(),
                inquiry.getCreatedAt(),
                inquiry.getUpdatedAt(),
                replyResponses,
                attachmentResponses
        );
    }
}
