import { api } from "../utils/api";
import type { PageResponse } from "../types";
import type {
  BankTransferAttachment,
  LedgerReceipt,
  SettlementAccount,
  TransferLedgerEntry,
} from "../types/bankTransfer";

const BANK_BASE = "/v1/bank-transfers";
const ADMIN_SETTLEMENT = "/v1/admin/settlement-accounts";
const ADMIN_BANK = "/v1/admin/bank-transfers";

export async function getPublicSettlementAccounts(): Promise<SettlementAccount[]> {
  const res = await api.get<SettlementAccount[]>(`${BANK_BASE}/settlement-accounts`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load accounts");
  return res.data;
}

export async function reportDeposit(body: {
  settlementAccountId: number;
  entryType: "DEPOSIT";
  amount: number;
  currency?: string;
  depositorName?: string;
  depositorMemo?: string;
  refType?: string;
  refId?: number;
  idempotencyKey?: string;
  files?: File[];
}): Promise<TransferLedgerEntry> {
  const { files, ...rest } = body;
  const hasFiles = Array.isArray(files) && files.length > 0;
  if (hasFiles) {
    const fd = new FormData();
    fd.append("report", new Blob([JSON.stringify(rest)], { type: "application/json" }));
    files!.forEach((f) => fd.append("files", f));
    const res = await api.upload<TransferLedgerEntry>(`${BANK_BASE}/deposit-reports`, fd);
    if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to report deposit");
    return res.data;
  }
  const res = await api.post<TransferLedgerEntry>(`${BANK_BASE}/deposit-reports`, rest);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to report deposit");
  return res.data;
}

export async function getMyLedgerEntries(page = 0, size = 20): Promise<PageResponse<TransferLedgerEntry>> {
  const res = await api.get<PageResponse<TransferLedgerEntry>>(`${BANK_BASE}?page=${page}&size=${size}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load entries");
  return res.data;
}

export async function getMyLedgerEntry(id: number): Promise<TransferLedgerEntry> {
  const res = await api.get<TransferLedgerEntry>(`${BANK_BASE}/${id}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load entry");
  return res.data;
}

export async function getLedgerReceipt(id: number): Promise<LedgerReceipt> {
  const res = await api.get<LedgerReceipt>(`${BANK_BASE}/${id}/receipt`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load receipt");
  return res.data;
}

export async function adminListSettlementAccounts(): Promise<SettlementAccount[]> {
  const res = await api.get<SettlementAccount[]>(ADMIN_SETTLEMENT);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminCreateSettlementAccount(body: {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  displayMemo?: string;
}): Promise<SettlementAccount> {
  const res = await api.post<SettlementAccount>(ADMIN_SETTLEMENT, body);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminUpdateSettlementAccount(
  id: number,
  body: { bankName?: string; accountNumber?: string; accountHolder?: string; displayMemo?: string; active?: boolean }
): Promise<SettlementAccount> {
  const res = await api.put<SettlementAccount>(`${ADMIN_SETTLEMENT}/${id}`, body);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminDeleteSettlementAccount(id: number): Promise<void> {
  const res = await api.delete<null>(`${ADMIN_SETTLEMENT}/${id}`);
  if (res.code !== 200) throw new Error(res.message);
}

export async function adminListLedgerEntries(params: {
  page?: number;
  size?: number;
  status?: string;
  entryType?: string;
  userEmail?: string;
}): Promise<PageResponse<TransferLedgerEntry>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.size != null) q.set("size", String(params.size));
  if (params.status) q.set("status", params.status);
  if (params.entryType) q.set("entryType", params.entryType);
  if (params.userEmail != null && params.userEmail.trim() !== "") {
    q.set("userEmail", params.userEmail.trim());
  }
  const res = await api.get<PageResponse<TransferLedgerEntry>>(`${ADMIN_BANK}?${q}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminGetLedgerEntry(id: number): Promise<TransferLedgerEntry> {
  const res = await api.get<TransferLedgerEntry>(`${ADMIN_BANK}/${id}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminConfirmLedgerEntry(id: number, adminMemo?: string): Promise<TransferLedgerEntry> {
  const res = await api.post<TransferLedgerEntry>(`${ADMIN_BANK}/${id}/confirm`, { adminMemo });
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminSettleLedger(
  parentId: number,
  amount: number,
  adminMemo?: string
): Promise<TransferLedgerEntry> {
  const res = await api.post<TransferLedgerEntry>(`${ADMIN_BANK}/${parentId}/settlement`, { amount, adminMemo });
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminRefundLedger(
  parentId: number,
  amount: number,
  adminMemo?: string
): Promise<TransferLedgerEntry> {
  const res = await api.post<TransferLedgerEntry>(`${ADMIN_BANK}/${parentId}/refund`, { amount, adminMemo });
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminCancelLedgerEntry(id: number, adminMemo?: string): Promise<TransferLedgerEntry> {
  const res = await api.post<TransferLedgerEntry>(`${ADMIN_BANK}/${id}/cancel`, { adminMemo });
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function listNoticeImages(): Promise<BankTransferAttachment[]> {
  const res = await api.get<BankTransferAttachment[]>(`${BANK_BASE}/notice-images`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load notice images");
  return res.data;
}

export async function adminListNoticeImages(): Promise<BankTransferAttachment[]> {
  const res = await api.get<BankTransferAttachment[]>(`${ADMIN_BANK}/notice-images`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminUploadNoticeImages(files: File[]): Promise<BankTransferAttachment[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await api.upload<BankTransferAttachment[]>(`${ADMIN_BANK}/notice-images`, fd);
  if (res.code !== 200 || res.data == null) throw new Error(res.message);
  return res.data;
}

export async function adminDeleteNoticeImage(attachmentId: number): Promise<void> {
  const res = await api.delete<null>(`${ADMIN_BANK}/notice-images/${attachmentId}`);
  if (res.code !== 200) throw new Error(res.message);
}
