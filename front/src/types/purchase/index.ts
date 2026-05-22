import type { PurchaseRequestStatus } from "../domain";

export interface PurchaseAttachment {
  id: number;
  originalFilename: string;
  storedUrl: string;
  thumbnailUrl?: string;
  viewUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedByAdmin?: boolean;
}

export interface PurchaseItem {
  url: string;
  shop?: string;
  priceKrw: number;
  quantity: number;
}

export interface PurchaseRequestCreatePayload {
  productName: string;
  quantity?: number;
  urls?: string[];
  items?: PurchaseItem[];
  options?: Record<string, string>;
  priceRub?: number;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  totalAmountKrw?: number;
  memo?: string;
  status?: PurchaseRequestStatus;
  files?: File[];
}

export interface PurchaseRequestListItem {
  id: number;
  requestNumber: string;
  productName: string;
  quantity: number;
  totalAmountKrw?: number;
  chargedAmountKrw?: number;
  settledAmountKrw?: number;
  status: PurchaseRequestStatus;
  createdAt: string;
}

export interface PurchaseRequestDetail extends PurchaseRequestListItem {
  userId: number;
  userEmail?: string;
  userNickname?: string;
  urls?: string[];
  options?: Record<string, unknown>;
  priceRub?: number;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  memo?: string;
  adminMemo?: string;
  assignedAdminId?: number;
  trackingNumber?: string;
  items?: PurchaseItem[];
  attachments?: PurchaseAttachment[];
  updatedAt: string;
}

export interface GetMyPurchaseRequestsParams {
  status?: PurchaseRequestStatus;
  page?: number;
  size?: number;
  sort?: "createdAt,asc" | "createdAt,desc";
}
