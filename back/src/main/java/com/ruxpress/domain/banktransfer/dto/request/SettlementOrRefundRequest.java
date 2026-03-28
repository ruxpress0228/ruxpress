package com.ruxpress.domain.banktransfer.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SettlementOrRefundRequest {

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount;

    private String adminMemo;
}
