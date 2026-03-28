import { api } from "../utils/api";
import type { PageResponse, PurchaseRequest, PurchaseRequestStatus } from "../types";

const ADMIN_PURCHASE = "/v1/admin/purchases";

export async function adminListPurchaseRequests(params: {
  page?: number;
  size?: number;
  status?: PurchaseRequestStatus;
}): Promise<PageResponse<PurchaseRequest>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.size != null) q.set("size", String(params.size));
  if (params.status) q.set("status", params.status);
  const res = await api.get<PageResponse<PurchaseRequest>>(`${ADMIN_PURCHASE}?${q}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load");
  return res.data;
}

export async function adminGetPurchaseRequest(id: number): Promise<PurchaseRequest> {
  const res = await api.get<PurchaseRequest>(`${ADMIN_PURCHASE}/${id}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load");
  return res.data;
}

export async function adminUpdatePurchaseStatus(
  id: number,
  status: PurchaseRequestStatus,
  adminMemo?: string
): Promise<PurchaseRequest> {
  const res = await api.patch<PurchaseRequest>(`${ADMIN_PURCHASE}/${id}/status`, { status, adminMemo });
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to update");
  return res.data;
}
