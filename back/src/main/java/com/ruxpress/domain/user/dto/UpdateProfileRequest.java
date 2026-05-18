package com.ruxpress.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "닉네임을 입력하세요.")
    @Size(min = 1, max = 50)
    private String nickname;

    @Size(max = 10)
    private String addressPostalCode;

    @NotBlank(message = "주소를 입력하세요.")
    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;
}
