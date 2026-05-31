import { useCallback } from "react";
import type { PageResponse } from "../../types";
import type {
  GetMyPurchaseRequestsParams,
  PurchaseRequestCreatePayload,
  PurchaseRequestDetail,
  PurchaseRequestListItem,
} from "../../types/purchase";
import { api } from "../../utils/api";
import { DEFAULT_PAGE_SIZE } from "../../utils/constants";

export function usePurchase() {
  const PURCHASE_BASE = "/v1/purchases";

  const createPurchaseRequest = useCallback((payload: PurchaseRequestCreatePayload): Promise<PurchaseRequestDetail> => {
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
  }, []);

  const getMyPurchaseRequests = useCallback(
    (params?: GetMyPurchaseRequestsParams): Promise<PageResponse<PurchaseRequestListItem>> => {
      const query = new URLSearchParams();
      query.set("page", String(params?.page ?? 0));
      query.set("size", String(params?.size ?? DEFAULT_PAGE_SIZE));
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
    },
    [],
  );

  const getRecentPurchaseRequests = useCallback((): Promise<PurchaseRequestListItem[]> => {
    return api.get<PurchaseRequestListItem[]>(`${PURCHASE_BASE}/recent`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch recent purchase requests");
      }
      return res.data;
    });
  }, []);

  const getMyPurchaseRequest = useCallback((purchaseRequestId: number): Promise<PurchaseRequestDetail> => {
    return api.get<PurchaseRequestDetail>(`${PURCHASE_BASE}/${purchaseRequestId}`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch purchase request");
      }
      return res.data;
    });
  }, []);

  const getAdminPurchaseRequest = useCallback((id: number): Promise<PurchaseRequestDetail> => {
    return api.get<PurchaseRequestDetail>(`/v1/admin/purchases/${id}`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch purchase request");
      }
      return res.data;
    });
  }, []);

  const getAdminPurchaseRequests = useCallback(
    (params?: GetMyPurchaseRequestsParams): Promise<PageResponse<PurchaseRequestListItem>> => {
      const query = new URLSearchParams();
      query.set("page", String(params?.page ?? 0));
      query.set("size", String(params?.size ?? DEFAULT_PAGE_SIZE));
      query.set("sort", params?.sort ?? "createdAt,desc");
      if (params?.status) {
        query.set("status", params.status);
      }
      return api.get<PageResponse<PurchaseRequestListItem>>(`/v1/admin/purchases?${query.toString()}`).then((res) => {
        if (res.code !== 200 || res.data == null) {
          throw new Error(res.message || "Failed to fetch purchase requests");
        }
        return res.data;
      });
    },
    [],
  );

  return {
    createPurchaseRequest,
    getMyPurchaseRequests,
    getRecentPurchaseRequests,
    getMyPurchaseRequest,
    getAdminPurchaseRequests,
    getAdminPurchaseRequest,
  };
}
