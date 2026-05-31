export type TransferLedgerEntryType = 'DEPOSIT' | 'SETTLEMENT' | 'REFUND';
export type TransferLedgerStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface BankTransferAttachment {
  id: number;
  originalFilename: string;
  storedUrl: string;
  thumbnailUrl?: string | null;
  viewUrl?: string | null;
  fileSize: number;
  mimeType: string;
}

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
  userEmail?: string | null;
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
  attachments?: BankTransferAttachment[];
  remainingSettleOrRefundAmount?: number | null;
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
