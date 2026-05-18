import { api } from "../utils/api";
import type { PageResponse } from "../types";
import type { PurchaseRequestDetail } from "../types/purchase";
import type { PurchaseRequestStatus } from "../types/domain";

const ADMIN_PURCHASES = "/v1/admin/purchases";

export async function adminListPurchaseRequests(params: {
  page?: number;
  size?: number;
  status?: PurchaseRequestStatus;
  sort?: string;
}): Promise<PageResponse<PurchaseRequestDetail>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.size != null) q.set("size", String(params.size));
  if (params.status) q.set("status", params.status);
  if (params.sort) q.set("sort", params.sort);
  const res = await api.get<PageResponse<PurchaseRequestDetail>>(`${ADMIN_PURCHASES}?${q}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load purchases");
  return res.data;
}

export async function adminGetPurchaseRequest(id: number): Promise<PurchaseRequestDetail> {
  const res = await api.get<PurchaseRequestDetail>(`${ADMIN_PURCHASES}/${id}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load purchase");
  return res.data;
}

export async function adminUpdatePurchaseStatus(
  id: number,
  body: { status: PurchaseRequestStatus; adminMemo?: string }
): Promise<PurchaseRequestDetail> {
  const res = await api.patch<PurchaseRequestDetail>(`${ADMIN_PURCHASES}/${id}/status`, body);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to update status");
  return res.data;
}

export async function adminCreditPurchaseWallet(
  id: number,
  body: { amount: number; idempotencyKey: string; settledAmountKrw?: number; adminMemo?: string }
): Promise<PurchaseRequestDetail> {
  const res = await api.post<PurchaseRequestDetail>(`${ADMIN_PURCHASES}/${id}/wallet-credits`, body);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to credit wallet");
  return res.data;
}
