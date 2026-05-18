export type ChatRoomStatus = 'OPEN' | 'CLOSED';
export type SenderType = 'USER' | 'ADMIN';

export interface ChatRoom {
  id: string;
  userId: number;
  adminId: number | null;
  status: ChatRoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderType: SenderType;
  content: string;
  read: boolean;
  createdAt: string;
}
