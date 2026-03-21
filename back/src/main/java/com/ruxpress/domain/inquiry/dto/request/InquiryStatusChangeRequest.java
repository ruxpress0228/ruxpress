package com.ruxpress.domain.inquiry.dto.request;

import com.ruxpress.domain.inquiry.entity.InquiryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InquiryStatusChangeRequest {

    @NotNull(message = "상태를 선택해주세요")
    private InquiryStatus status;
}
