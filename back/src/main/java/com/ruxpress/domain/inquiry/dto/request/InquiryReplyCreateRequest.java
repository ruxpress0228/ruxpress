package com.ruxpress.domain.inquiry.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InquiryReplyCreateRequest {

    @NotBlank(message = "답변 내용을 입력해주세요")
    @Size(max = 10000)
    private String content;
}
