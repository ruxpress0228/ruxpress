import type { PageResponse } from "../../types";
import type {
  GetMyPurchaseRequestsParams,
  PurchaseRequestCreatePayload,
  PurchaseRequestDetail,
  PurchaseRequestListItem,
} from "../../types/purchase";
import { api } from "../../utils/api";

export function usePurchase() {
  const PURCHASE_BASE = "/v1/purchases";

  const createPurchaseRequest = (payload: PurchaseRequestCreatePayload): Promise<PurchaseRequestDetail> => {
    return api
      .post<PurchaseRequestDetail>(PURCHASE_BASE, payload, {
        multipart: { jsonFieldName: "purchase", filesFieldName: "files" },
      })
      .then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to create purchase request");
      }
      return res.data;
    });
  };

  const getMyPurchaseRequests = (
    params?: GetMyPurchaseRequestsParams
  ): Promise<PageResponse<PurchaseRequestListItem>> => {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 10));
    query.set("sort", params?.sort ?? "createdAt,desc");
    if (params?.status) {
      query.set("status", params.status);
    }

    return api.get<PageResponse<PurchaseRequestListItem>>(`${PURCHASE_BASE}?${query.toString()}`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch purchase requests");
      }
      return res.data;
    });
  };

  const getRecentPurchaseRequests = (): Promise<PurchaseRequestListItem[]> => {
    return api.get<PurchaseRequestListItem[]>(`${PURCHASE_BASE}/recent`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch recent purchase requests");
      }
      return res.data;
    });
  };

  return {
    createPurchaseRequest,
    getMyPurchaseRequests,
    getRecentPurchaseRequests,
  };
}
