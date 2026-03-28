import type { PurchaseRequestStatus } from "../domain";

export interface PurchaseRequestCreatePayload {
  productName: string;
  quantity: number;
  urls?: string[];
  options?: Record<string, string>;
  priceRub?: number;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  totalAmountKrw?: number;
  memo?: string;
  status?: PurchaseRequestStatus;
}

export interface PurchaseRequestListItem {
  id: number;
  requestNumber: string;
  productName: string;
  quantity: number;
  totalAmountKrw?: number;
  status: PurchaseRequestStatus;
  createdAt: string;
}

export interface PurchaseRequestDetail extends PurchaseRequestListItem {
  userId: number;
  urls?: string[];
  options?: Record<string, unknown>;
  priceRub?: number;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  memo?: string;
  adminMemo?: string;
  assignedAdminId?: number;
  updatedAt: string;
}

export interface GetMyPurchaseRequestsParams {
  status?: PurchaseRequestStatus;
  page?: number;
  size?: number;
  sort?: "createdAt,asc" | "createdAt,desc";
}
