package com.ruxpress.domain.banktransfer.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "transfer_ledger_entries")
public class TransferLedgerEntry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "settlement_account_id", nullable = false)
    private Long settlementAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 32)
    private TransferLedgerEntryType entryType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TransferLedgerStatus status = TransferLedgerStatus.PENDING;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "KRW";

    @Column(name = "depositor_name", length = 100)
    private String depositorName;

    @Column(name = "depositor_memo", length = 500)
    private String depositorMemo;

    @Column(name = "admin_memo", length = 500)
    private String adminMemo;

    @Column(name = "ref_type", length = 50)
    private String refType;

    @Column(name = "ref_id")
    private Long refId;

    @Column(name = "parent_entry_id")
    private Long parentEntryId;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "confirmed_by_admin_id")
    private Long confirmedByAdminId;

    @Column(name = "idempotency_key", length = 100, unique = true)
    private String idempotencyKey;

    @Version
    @Column(nullable = false)
    private int version;

    public static TransferLedgerEntry createRootEntry(
            Long userId,
            Long settlementAccountId,
            TransferLedgerEntryType entryType,
            BigDecimal amount,
            String currency,
            String depositorName,
            String depositorMemo,
            String refType,
            Long refId,
            String idempotencyKey) {
        TransferLedgerEntry e = new TransferLedgerEntry();
        e.userId = userId;
        e.settlementAccountId = settlementAccountId;
        e.entryType = entryType;
        e.amount = amount;
        e.currency = currency != null ? currency : "KRW";
        e.depositorName = depositorName;
        e.depositorMemo = depositorMemo;
        e.refType = refType;
        e.refId = refId;
        e.idempotencyKey = idempotencyKey;
        e.status = TransferLedgerStatus.PENDING;
        e.parentEntryId = null;
        return e;
    }

    public static TransferLedgerEntry createChildEntry(
            Long userId,
            Long settlementAccountId,
            TransferLedgerEntryType entryType,
            BigDecimal amount,
            String currency,
            Long parentEntryId,
            String adminMemo,
            Long confirmedByAdminId) {
        TransferLedgerEntry e = new TransferLedgerEntry();
        e.userId = userId;
        e.settlementAccountId = settlementAccountId;
        e.entryType = entryType;
        e.amount = amount;
        e.currency = currency != null ? currency : "KRW";
        e.parentEntryId = parentEntryId;
        e.adminMemo = adminMemo;
        e.status = TransferLedgerStatus.CONFIRMED;
        e.confirmedAt = LocalDateTime.now();
        e.confirmedByAdminId = confirmedByAdminId;
        return e;
    }

    public boolean isRootDeposit() {
        return parentEntryId == null
                && (entryType == TransferLedgerEntryType.DEPOSIT || entryType == TransferLedgerEntryType.ESCROW_HOLD);
    }

    public void applyConfirm(Long adminId, String adminMemo) {
        this.status = TransferLedgerStatus.CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
        this.confirmedByAdminId = adminId;
        if (adminMemo != null && !adminMemo.isBlank()) {
            this.adminMemo = adminMemo;
        }
    }

    public void applyCancel(String adminMemo) {
        this.status = TransferLedgerStatus.CANCELLED;
        if (adminMemo != null && !adminMemo.isBlank()) {
            this.adminMemo = adminMemo;
        }
    }
}
