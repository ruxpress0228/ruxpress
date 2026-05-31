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
  addressPostalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  notificationSettings?: NotificationSettings;
  lastLoginAt?: string;
  withdrawnAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: number;
  label?: string;
  recipientName?: string;
  recipientPhone?: string;
  postalCode?: string;
  addressLine1: string;
  addressLine2?: string;
  isDefault: boolean;
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
  | 'REQUESTED'
  | 'PURCHASING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PurchaseRequest {
  id: number;
  userId: number;
  requestNumber: string;
  requestName: string;
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
  viewUrl?: string;
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
  nickname?: string;
  email?: string;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  replies?: InquiryReply[];
  attachments?: Attachment[];
}

export interface InquiryListItem {
  id: number;
  category: InquiryCategory;
  title: string;
  status: InquiryStatus;
  replyCount: number;
  hasUnreadReply: boolean;
  createdAt: string;
}

export interface AdminInquiryListItem extends InquiryListItem {
  userId: number;
  nickname?: string;
  email?: string;
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

export type AdminNotificationType =
  | 'NEW_PURCHASE_REQUEST'
  | 'NEW_DEPOSIT_REPORT'
  | 'NEW_INQUIRY'
  | 'NEW_CHAT_MESSAGE'
  | 'NEGATIVE_WALLET_AFTER_REFUND';

export interface AdminNotification {
  id: number;
  type: AdminNotificationType;
  title: string;
  body: string;
  dataJson?: string;
  linkUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AdminNotificationSummary {
  unreadCount: number;
  totalElements: number;
  items: AdminNotification[];
}
