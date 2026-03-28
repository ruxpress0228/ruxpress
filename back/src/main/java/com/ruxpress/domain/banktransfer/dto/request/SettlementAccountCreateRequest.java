package com.ruxpress.domain.banktransfer.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SettlementAccountCreateRequest {

    @NotBlank
    private String bankName;

    @NotBlank
    private String accountNumber;

    @NotBlank
    private String accountHolder;

    private String displayMemo;
}
