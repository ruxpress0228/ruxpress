package com.ruxpress.domain.banktransfer.entity;

import com.ruxpress.common.entity.BaseEntity;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
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
        if (entryType != TransferLedgerEntryType.DEPOSIT) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
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
        return parentEntryId == null && entryType == TransferLedgerEntryType.DEPOSIT;
    }

    /**
     * 루트 입금 행만 PENDING → CONFIRMED 전이.
     */
    public void applyConfirm(Long adminId, String adminMemo) {
        if (!isRootDeposit()) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (this.status != TransferLedgerStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        this.status = TransferLedgerStatus.CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
        this.confirmedByAdminId = adminId;
        if (adminMemo != null && !adminMemo.isBlank()) {
            this.adminMemo = adminMemo;
        }
    }

    /**
     * 루트 입금 행만 PENDING → CANCELLED 전이.
     */
    public void applyCancel(String adminMemo) {
        if (!isRootDeposit()) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (this.status != TransferLedgerStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        this.status = TransferLedgerStatus.CANCELLED;
        if (adminMemo != null && !adminMemo.isBlank()) {
            this.adminMemo = adminMemo;
        }
    }

    /**
     * 정산·환불 원장 행의 부모로 쓸 수 있는지: 루트 입금이며 관리자 확정된 상태.
     */
    public void assertConfirmedRootForChildLedger() {
        if (!isRootDeposit()) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (this.status != TransferLedgerStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
    }

    /**
     * 부모(확정된 루트) 금액을 넘지 않는 양의 금액인지 (정산·환불 자식 행 금액).
     */
    public void assertChildAmountAllowed(BigDecimal childAmount) {
        if (childAmount == null || childAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.LEDGER_AMOUNT_INVALID);
        }
        if (childAmount.compareTo(this.amount) > 0) {
            throw new BusinessException(ErrorCode.LEDGER_AMOUNT_INVALID);
        }
    }

    /**
     * 사용자 영수증(거래확인서)을 내려줄 수 있는 상태인지.
     */
    public void assertIssuableReceipt() {
        if (this.status != TransferLedgerStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
    }
}
