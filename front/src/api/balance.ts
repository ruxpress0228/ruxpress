import { api } from "../utils/api";
import type { PageResponse } from "../types";

export interface BalanceResponse {
  balance: number;
}

export type WalletLedgerEntryType =
  | "CREDIT_BANK_DEPOSIT"
  | "CREDIT_CARD"
  | "CREDIT_PURCHASE_REFUND"
  | "DEBIT_PURCHASE"
  | "DEBIT_BANK_REFUND";

export interface WalletLedgerEntry {
  id: number;
  entryType: WalletLedgerEntryType;
  amount: number;
  currency: string;
  transferLedgerEntryId?: number;
  purchaseRequestId?: number;
  transferRefundEntryId?: number;
  memo?: string;
  createdAt: string;
}

const BALANCE_BASE = "/v1/balances";

export async function getMyBalance(): Promise<BalanceResponse> {
  const res = await api.get<BalanceResponse>(`${BALANCE_BASE}/me`);
  if (res.code !== 200 || res.data == null)
    throw new Error(res.message || "Failed to load balance");
  return res.data;
}

export async function getMyWalletLedger(
  page = 0,
  size = 20
): Promise<PageResponse<WalletLedgerEntry>> {
  const res = await api.get<PageResponse<WalletLedgerEntry>>(
    `${BALANCE_BASE}/me/ledger?page=${page}&size=${size}`
  );
  if (res.code !== 200 || res.data == null)
    throw new Error(res.message || "Failed to load ledger");
  return res.data;
}
