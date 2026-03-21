package com.ruxpress.domain.inquiry.dto.response;

import com.ruxpress.domain.inquiry.entity.InquiryCategory;
import com.ruxpress.domain.inquiry.entity.ReplyTemplate;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReplyTemplateResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final InquiryCategory category;
    private final int sortOrder;

    public static ReplyTemplateResponse from(ReplyTemplate t) {
        return new ReplyTemplateResponse(t.getId(), t.getTitle(), t.getContent(), t.getCategory(), t.getSortOrder());
    }
}
