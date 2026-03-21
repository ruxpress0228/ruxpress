package com.ruxpress.domain.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SettingUpdateRequest {

    @NotBlank(message = "값을 입력해주세요")
    private String value;
}
