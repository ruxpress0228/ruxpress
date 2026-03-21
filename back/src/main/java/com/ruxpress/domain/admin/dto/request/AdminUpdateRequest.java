package com.ruxpress.domain.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateRequest {

    @NotBlank(message = "이름을 입력해주세요")
    private String name;

    private String phone;
}
