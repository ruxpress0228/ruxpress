export type ChatRoomStatus = 'OPEN' | 'CLOSED';
export type SenderType = 'USER' | 'ADMIN';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE';

export type ChatRetentionPeriod =
  | 'PERMANENT'
  | 'MONTHS_1'
  | 'MONTHS_3'
  | 'MONTHS_6'
  | 'MONTHS_12'
  | 'MONTHS_24';

export interface ChatRoomClosedEvent {
  eventType: 'ROOM_CLOSED';
  roomId: string;
  closedAt: string;
}

export function isChatRoomClosedEvent(payload: unknown): payload is ChatRoomClosedEvent {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as ChatRoomClosedEvent).eventType === 'ROOM_CLOSED'
  );
}

export interface ChatRetentionOption {
  value: ChatRetentionPeriod;
  months: number;
}

export interface ChatCleanupSettings {
  retentionPeriod: ChatRetentionPeriod;
  options: ChatRetentionOption[];
}

export interface ChatRoom {
  id: string;
  userId: number;
  adminId: number | null;
  status: ChatRoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatAttachment {
  id: number;
  originalFilename: string;
  storedUrl: string;
  thumbnailUrl?: string;
  viewUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedByAdmin?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderType: SenderType;
  content: string;
  messageType: ChatMessageType;
  attachment?: ChatAttachment | null;
  read: boolean;
  createdAt: string;
}
