export type ChatRoomStatus = 'OPEN' | 'CLOSED';
export type SenderType = 'USER' | 'ADMIN';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE';

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
