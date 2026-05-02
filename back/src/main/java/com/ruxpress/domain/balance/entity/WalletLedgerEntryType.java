package com.ruxpress.domain.balance.entity;

public enum WalletLedgerEntryType {
    CREDIT_BANK_DEPOSIT,
    CREDIT_CARD,
    /** 구매 건 전체 취소·환불 시 잔여 차감분 환급 */
    CREDIT_PURCHASE_REFUND,
    /** 실제 비용 확정 후 차액만큼 지갑으로 되돌림 (복수 가능) */
    CREDIT_PURCHASE_ADJUSTMENT,
    DEBIT_PURCHASE,
    DEBIT_BANK_REFUND
}
