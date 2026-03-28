package com.ruxpress.domain.banktransfer.dto.response;

import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TransferLedgerEntryResponse {

    private final Long id;
    private final Long userId;
    private final Long settlementAccountId;
    private final TransferLedgerEntryType entryType;
    private final TransferLedgerStatus status;
    private final BigDecimal amount;
    private final String currency;
    private final String depositorName;
    private final String depositorMemo;
    private final String adminMemo;
    private final String refType;
    private final Long refId;
    private final Long parentEntryId;
    private final LocalDateTime confirmedAt;
    private final Long confirmedByAdminId;
    private final LocalDateTime createdAt;
    private final SettlementAccountResponse settlementAccount;

    public static TransferLedgerEntryResponse of(
            TransferLedgerEntry e,
            SettlementAccountResponse settlementAccount) {
        return new TransferLedgerEntryResponse(
                e.getId(),
                e.getUserId(),
                e.getSettlementAccountId(),
                e.getEntryType(),
                e.getStatus(),
                e.getAmount(),
                e.getCurrency(),
                e.getDepositorName(),
                e.getDepositorMemo(),
                e.getAdminMemo(),
                e.getRefType(),
                e.getRefId(),
                e.getParentEntryId(),
                e.getConfirmedAt(),
                e.getConfirmedByAdminId(),
                e.getCreatedAt(),
                settlementAccount);
    }
}
