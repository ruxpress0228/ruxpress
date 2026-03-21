package com.ruxpress.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmailVerifyRequest {

    @NotBlank(message = "이메일을 입력하세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "인증번호를 입력하세요.")
    @Size(min = 6, max = 6, message = "인증번호는 6자리여야 합니다.")
    @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
    private String code;
}
