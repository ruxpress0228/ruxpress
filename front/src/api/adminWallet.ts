import { api } from "../utils/api";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";
import type { PageResponse } from "../types";
import type { WalletLedgerEntry } from "./balance";

const ADMIN_WALLETS = "/v1/admin/wallets";

export interface AdminUserWallet {
  userId: number;
  email: string;
  nickname: string;
  status: string;
  balance: number;
}

export interface AdminWalletAdjustResult {
  userId: number;
  balanceAfter: number;
  ledgerEntry: WalletLedgerEntry;
}

export async function adminListUserWallets(params: {
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<AdminUserWallet>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.size != null) q.set("size", String(params.size));
  if (params.keyword?.trim()) q.set("keyword", params.keyword.trim());
  const res = await api.get<PageResponse<AdminUserWallet>>(`${ADMIN_WALLETS}?${q}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load wallets");
  return res.data;
}

export async function adminGetUserWallet(userId: number): Promise<AdminUserWallet> {
  const res = await api.get<AdminUserWallet>(`${ADMIN_WALLETS}/users/${userId}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load wallet");
  return res.data;
}

export async function adminGetUserWalletLedger(
  userId: number,
  page = 0,
  size = DEFAULT_PAGE_SIZE
): Promise<PageResponse<WalletLedgerEntry>> {
  const res = await api.get<PageResponse<WalletLedgerEntry>>(
    `${ADMIN_WALLETS}/users/${userId}/ledger?page=${page}&size=${size}`
  );
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load ledger");
  return res.data;
}

export async function adminCreditUserWallet(
  userId: number,
  amount: number,
  memo?: string
): Promise<AdminWalletAdjustResult> {
  const res = await api.post<AdminWalletAdjustResult>(`${ADMIN_WALLETS}/users/${userId}/credit`, {
    amount,
    memo,
  });
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to credit");
  return res.data;
}

export async function adminDebitUserWallet(
  userId: number,
  amount: number,
  memo?: string
): Promise<AdminWalletAdjustResult> {
  const res = await api.post<AdminWalletAdjustResult>(`${ADMIN_WALLETS}/users/${userId}/debit`, {
    amount,
    memo,
  });
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to debit");
  return res.data;
}
