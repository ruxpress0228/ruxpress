package com.ruxpress.domain.inquiry.dto.request;

import com.ruxpress.domain.inquiry.entity.InquiryCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReplyTemplateRequest {

    @NotBlank(message = "템플릿 제목을 입력해주세요")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "템플릿 내용을 입력해주세요")
    @Size(max = 10000)
    private String content;

    private InquiryCategory category;

    private int sortOrder;
}
