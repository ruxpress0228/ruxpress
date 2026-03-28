package com.ruxpress.domain.banktransfer.dto.request;

import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DepositReportRequest {

    @NotNull
    private Long settlementAccountId;

    @NotNull
    private TransferLedgerEntryType entryType;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount;

    private String currency = "KRW";

    private String depositorName;

    private String depositorMemo;

    private String refType;

    private Long refId;

    private String idempotencyKey;
}
