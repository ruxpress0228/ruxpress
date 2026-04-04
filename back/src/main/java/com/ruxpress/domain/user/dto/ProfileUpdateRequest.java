package com.ruxpress.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProfileUpdateRequest {

    @NotBlank(message = "닉네임을 입력하세요.")
    @Size(max = 50, message = "닉네임은 50자 이하여야 합니다.")
    private String nickname;

    @Size(max = 10, message = "우편번호는 10자 이하여야 합니다.")
    private String addressPostalCode;

    @NotBlank(message = "기본 주소를 입력하세요.")
    @Size(max = 255, message = "기본 주소는 255자 이하여야 합니다.")
    private String addressLine1;

    @Size(max = 255, message = "상세 주소는 255자 이하여야 합니다.")
    private String addressLine2;
}
