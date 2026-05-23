package com.ruxpress.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserAddressCreateRequest {

    @Size(max = 50)
    private String label;

    @Size(max = 50)
    private String recipientName;

    @Size(max = 20)
    private String recipientPhone;

    @Size(max = 10)
    private String postalCode;

    @NotBlank(message = "기본 주소를 입력해주세요")
    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;

    private Boolean isDefault;
}
