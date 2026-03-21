package com.ruxpress.domain.inquiry.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class InquiryReplyResponse {

    private final Long id;
    private final Long adminId;
    private final String content;
    private final boolean isRead;
    private final LocalDateTime createdAt;
}
