-- 관리자 포인트 수동 조정 원장 유형 추가
ALTER TABLE wallet_ledger_entries
    MODIFY entry_type ENUM(
        'CREDIT_BANK_DEPOSIT',
        'CREDIT_CARD',
        'CREDIT_PURCHASE_REFUND',
        'CREDIT_PURCHASE_ADJUSTMENT',
        'DEBIT_PURCHASE',
        'DEBIT_BANK_REFUND',
        'CREDIT_ADMIN_ADJUSTMENT',
        'DEBIT_ADMIN_ADJUSTMENT'
    ) NOT NULL COMMENT '원장 유형';
