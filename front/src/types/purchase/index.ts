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

/** 구매 요청 시점 배송지 스냅샷 (API `shipping` 객체) */
export interface PurchaseShipping {
  userAddressId?: number | null;
  label?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
}

export interface PurchaseItem {
  url: string;
  shop?: string;
  priceKrw: number;
  quantity: number;
  /** 항목별 옵션 (신규). 예전 요청은 최상위 `options`만 있을 수 있음 */
  options?: Record<string, string>;
}

export interface PurchaseRequestCreatePayload {
  requestName: string;
  quantity?: number;
  urls?: string[];
  items?: PurchaseItem[];
  options?: Record<string, string>;
  priceRub?: number;
  quoteCurrency?: string;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  totalAmountKrw?: number;
  memo?: string;
  status?: PurchaseRequestStatus;
  /** 제출 시 필수: 내 배송지 목록 중 선택한 ID */
  shippingUserAddressId?: number;
  files?: File[];
}

export interface PurchaseRequestListItem {
  id: number;
  requestNumber: string;
  requestName: string;
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
  quoteCurrency?: string;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  memo?: string;
  adminMemo?: string;
  assignedAdminId?: number;
  trackingNumber?: string;
  shipping?: PurchaseShipping | null;
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
