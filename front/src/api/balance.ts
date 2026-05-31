import { api } from "../utils/api";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import type { PageResponse } from "../types";

const BASE = "/v1/balances";

export type WalletLedgerEntryType =
  | "CREDIT_BANK_DEPOSIT"
  | "CREDIT_CARD"
  | "CREDIT_PURCHASE_REFUND"
  | "CREDIT_PURCHASE_ADJUSTMENT"
  | "DEBIT_PURCHASE"
  | "DEBIT_BANK_REFUND"
  | "CREDIT_ADMIN_ADJUSTMENT"
  | "DEBIT_ADMIN_ADJUSTMENT";

export interface WalletLedgerEntry {
  id: number;
  entryType: WalletLedgerEntryType;
  amount: number;
  currency: string;
  transferLedgerEntryId?: number | null;
  purchaseRequestId?: number | null;
  transferRefundEntryId?: number | null;
  memo?: string | null;
  createdAt: string;
}

export async function getMyBalance(): Promise<number> {
  const res = await api.get<{ balance: number }>(`${BASE}/me`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load balance");
  return Number(res.data.balance);
}

export async function getMyWalletLedger(page = 0, size = DEFAULT_PAGE_SIZE): Promise<PageResponse<WalletLedgerEntry>> {
  const res = await api.get<PageResponse<WalletLedgerEntry>>(`${BASE}/me/ledger?page=${page}&size=${size}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load ledger");
  return res.data;
}
