package com.ruxpress.domain.inquiry.dto.response;

import com.ruxpress.domain.inquiry.entity.InquiryCategory;
import com.ruxpress.domain.inquiry.entity.InquiryStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class InquiryListResponse {

    private final Long id;
    private final InquiryCategory category;
    private final String title;
    private final InquiryStatus status;
    private final int replyCount;
    private final boolean hasUnreadReply;
    private final LocalDateTime createdAt;
}
