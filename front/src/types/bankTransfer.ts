export type TransferLedgerEntryType = 'DEPOSIT' | 'ESCROW_HOLD' | 'SETTLEMENT' | 'REFUND';
export type TransferLedgerStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface SettlementAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  displayMemo: string | null;
  active: boolean;
}

export interface TransferLedgerEntry {
  id: number;
  userId: number;
  settlementAccountId: number;
  entryType: TransferLedgerEntryType;
  status: TransferLedgerStatus;
  amount: number;
  currency: string;
  depositorName: string | null;
  depositorMemo: string | null;
  adminMemo: string | null;
  refType: string | null;
  refId: number | null;
  parentEntryId: number | null;
  confirmedAt: string | null;
  confirmedByAdminId: number | null;
  createdAt: string;
  settlementAccount: SettlementAccount;
}

export interface LedgerReceipt {
  entryId: number;
  entryType: string;
  status: string;
  amount: number;
  currency: string;
  confirmedAt: string | null;
  createdAt: string;
  settlementAccount: SettlementAccount;
  depositorName: string | null;
}
