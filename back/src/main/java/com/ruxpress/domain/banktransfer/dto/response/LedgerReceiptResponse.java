package com.ruxpress.domain.banktransfer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class LedgerReceiptResponse {

    private final Long entryId;
    private final String entryType;
    private final String status;
    private final BigDecimal amount;
    private final String currency;
    private final LocalDateTime confirmedAt;
    private final LocalDateTime createdAt;
    private final SettlementAccountResponse settlementAccount;
    private final String depositorName;
}
