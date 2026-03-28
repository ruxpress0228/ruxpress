package com.ruxpress.domain.banktransfer.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SettlementAccountUpdateRequest {

    private String bankName;
    private String accountNumber;
    private String accountHolder;
    private String displayMemo;
    private Boolean active;
}
