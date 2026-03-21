package com.ruxpress.domain.inquiry.dto.request;

import com.ruxpress.domain.inquiry.entity.InquiryCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InquiryCreateRequest {

    @NotNull(message = "문의 유형을 선택해주세요")
    private InquiryCategory category;

    @NotBlank(message = "제목을 입력해주세요")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "내용을 입력해주세요")
    @Size(max = 5000)
    private String content;
}
