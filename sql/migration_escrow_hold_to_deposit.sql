-- 에스크로 제거 후 레거시 원장 정리 (계좌이체 목록 500 방지)
UPDATE transfer_ledger_entries SET entry_type = 'DEPOSIT' WHERE entry_type = 'ESCROW_HOLD';

ALTER TABLE transfer_ledger_entries
  MODIFY entry_type ENUM('DEPOSIT', 'SETTLEMENT', 'REFUND') NOT NULL COMMENT '원장 유형';
