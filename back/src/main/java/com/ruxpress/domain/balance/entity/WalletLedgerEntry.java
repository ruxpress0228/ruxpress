package com.ruxpress.domain.balance.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "wallet_ledger_entries")
@EntityListeners(AuditingEntityListener.class)
public class WalletLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 50)
    private WalletLedgerEntryType entryType;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "KRW";

    @Column(name = "idempotency_key", nullable = false, length = 100, unique = true)
    private String idempotencyKey;

    @Column(name = "transfer_ledger_entry_id")
    private Long transferLedgerEntryId;

    @Column(name = "purchase_request_id")
    private Long purchaseRequestId;

    @Column(name = "transfer_refund_entry_id")
    private Long transferRefundEntryId;

    @Column(length = 500)
    private String memo;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static WalletLedgerEntry creditBankDeposit(Long userId, BigDecimal amount, Long transferLedgerEntryId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.CREDIT_BANK_DEPOSIT;
        e.amount = amount;
        e.transferLedgerEntryId = transferLedgerEntryId;
        e.idempotencyKey = "bank_credit:" + transferLedgerEntryId;
        return e;
    }

    public static WalletLedgerEntry debitPurchase(Long userId, BigDecimal amount, Long purchaseRequestId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.DEBIT_PURCHASE;
        e.amount = amount;
        e.purchaseRequestId = purchaseRequestId;
        e.idempotencyKey = "purchase_debit:" + purchaseRequestId;
        return e;
    }

    public static WalletLedgerEntry creditPurchaseRefund(Long userId, BigDecimal amount, Long purchaseRequestId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.CREDIT_PURCHASE_REFUND;
        e.amount = amount;
        e.purchaseRequestId = purchaseRequestId;
        e.idempotencyKey = "purchase_refund_full:" + purchaseRequestId;
        return e;
    }

    public static WalletLedgerEntry creditPurchaseAdjustment(
            Long userId,
            BigDecimal amount,
            Long purchaseRequestId,
            String idempotencyKey,
            String memo) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.CREDIT_PURCHASE_ADJUSTMENT;
        e.amount = amount;
        e.purchaseRequestId = purchaseRequestId;
        e.idempotencyKey = idempotencyKey;
        e.memo = memo;
        return e;
    }

    public static WalletLedgerEntry debitBankRefund(Long userId, BigDecimal amount, Long transferRefundEntryId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.DEBIT_BANK_REFUND;
        e.amount = amount;
        e.transferRefundEntryId = transferRefundEntryId;
        e.idempotencyKey = "bank_refund_debit:" + transferRefundEntryId;
        return e;
    }
}
