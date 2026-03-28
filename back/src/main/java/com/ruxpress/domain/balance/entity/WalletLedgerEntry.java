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
@Table(name = "wallet_ledger_entries", uniqueConstraints = {
        @UniqueConstraint(name = "UK_WALLET_LEDGER_PURCHASE", columnNames = {"purchase_request_id", "entry_type"})
})
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

    @Column(name = "transfer_ledger_entry_id", unique = true)
    private Long transferLedgerEntryId;

    @Column(name = "purchase_request_id")
    private Long purchaseRequestId;

    @Column(name = "transfer_refund_entry_id", unique = true)
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
        return e;
    }

    public static WalletLedgerEntry debitPurchase(Long userId, BigDecimal amount, Long purchaseRequestId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.DEBIT_PURCHASE;
        e.amount = amount;
        e.purchaseRequestId = purchaseRequestId;
        return e;
    }

    public static WalletLedgerEntry creditPurchaseRefund(Long userId, BigDecimal amount, Long purchaseRequestId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.CREDIT_PURCHASE_REFUND;
        e.amount = amount;
        e.purchaseRequestId = purchaseRequestId;
        return e;
    }

    public static WalletLedgerEntry debitBankRefund(Long userId, BigDecimal amount, Long transferRefundEntryId) {
        WalletLedgerEntry e = new WalletLedgerEntry();
        e.userId = userId;
        e.entryType = WalletLedgerEntryType.DEBIT_BANK_REFUND;
        e.amount = amount;
        e.transferRefundEntryId = transferRefundEntryId;
        return e;
    }
}
