package com.ruxpress.domain.inquiry.dto.response;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.domain.inquiry.entity.InquiryCategory;
import com.ruxpress.domain.inquiry.entity.InquiryStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class InquiryResponse {

    private final Long id;
    private final Long userId;
    private final InquiryCategory category;
    private final String title;
    private final String content;
    private final InquiryStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final List<InquiryReplyResponse> replies;
    private final List<AttachmentResponse> attachments;
}
