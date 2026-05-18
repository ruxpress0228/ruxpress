package com.ruxpress.domain.balance.dto;

import com.ruxpress.domain.balance.entity.WalletLedgerEntry;
import com.ruxpress.domain.balance.entity.WalletLedgerEntryType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class WalletLedgerEntryResponse {

    private final Long id;
    private final WalletLedgerEntryType entryType;
    private final BigDecimal amount;
    private final String currency;
    private final Long transferLedgerEntryId;
    private final Long purchaseRequestId;
    private final Long transferRefundEntryId;
    private final String memo;
    private final LocalDateTime createdAt;

    public static WalletLedgerEntryResponse from(WalletLedgerEntry e) {
        return new WalletLedgerEntryResponse(
                e.getId(),
                e.getEntryType(),
                e.getAmount(),
                e.getCurrency(),
                e.getTransferLedgerEntryId(),
                e.getPurchaseRequestId(),
                e.getTransferRefundEntryId(),
                e.getMemo(),
                e.getCreatedAt());
    }
}
