// Ruxpress Type Definitions based on Database Schema

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
export type SignupType = 'EMAIL' | 'PHONE' | 'GOOGLE';

export interface User {
  id: number;
  email: string;
  phone?: string;
  nickname: string;
  profileImageUrl?: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  signupType: SignupType;
  timezone: string;
  notificationSettings?: NotificationSettings;
  lastLoginAt?: string;
  withdrawnAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  push: {
    inquiryReply: boolean;
    notice: boolean;
    promotion: boolean;
    purchaseStatus: boolean;
  };
  sms: {
    inquiryReply: boolean;
    notice: boolean;
    promotion: boolean;
    purchaseStatus: boolean;
  };
  email: {
    inquiryReply: boolean;
    notice: boolean;
    promotion: boolean;
    purchaseStatus: boolean;
  };
}

export type PurchaseRequestStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'REVIEWING' 
  | 'CONFIRMED' 
  | 'PURCHASING' 
  | 'PURCHASED' 
  | 'SHIPPING' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export interface PurchaseRequest {
  id: number;
  userId: number;
  requestNumber: string;
  productName: string;
  quantity: number;
  urls?: Array<{ url: string; shop: string }>;
  options?: Array<{ name: string; value: string }>;
  priceRub?: number;
  priceKrw?: number;
  exchangeRateId?: number;
  feeAmount?: number;
  totalAmountKrw?: number;
  memo?: string;
  status: PurchaseRequestStatus;
  adminMemo?: string;
  assignedAdminId?: number;
  createdAt: string;
  updatedAt: string;
}

export type AttachmentType = 'PURCHASE' | 'INQUIRY' | 'REVIEW' | 'CHAT';

export interface Attachment {
  id: number;
  refType: AttachmentType;
  refId: number;
  originalFilename: string;
  storedUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  sortOrder: number;
  createdAt: string;
}

export type InquiryCategory = 'ORDER' | 'SHIPPING' | 'PAYMENT' | 'ETC';
export type InquiryStatus = 'PENDING' | 'REPLIED' | 'CLOSED';

export interface Inquiry {
  id: number;
  userId: number;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  replies?: InquiryReply[];
}

export interface InquiryReply {
  id: number;
  inquiryId: number;
  adminId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoticeStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'HIDDEN';

export interface Notice {
  id: number;
  adminId: number;
  title: string;
  content: string;
  isPinned: boolean;
  viewCount: number;
  status: NoticeStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  id: number;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: 'API' | 'MANUAL';
  adminId?: number;
  isCurrent: boolean;
  fetchedAt: string;
  createdAt: string;
}

export type AdminRole = 'SUPER_ADMIN' | 'COUNSELOR';
export type AdminStatus = 'ACTIVE' | 'INACTIVE';

export interface Admin {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  id: number;
  category: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}
