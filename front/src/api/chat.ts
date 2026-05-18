import { api } from '@/utils/api';
import type { ApiResponse, PageResponse } from '@/types/api';
import type { ChatRoom, ChatMessage } from '@/types/chat';

export function getOrCreateRoom(): Promise<ApiResponse<ChatRoom>> {
  return api.post<ChatRoom>('/v1/chat/rooms');
}

export function getMyChatRooms(): Promise<ApiResponse<ChatRoom[]>> {
  return api.get<ChatRoom[]>('/v1/chat/rooms');
}

export function getChatMessages(roomId: string): Promise<ApiResponse<ChatMessage[]>> {
  return api.get<ChatMessage[]>(`/v1/chat/rooms/${roomId}/messages`);
}

export function getAdminChatRooms(page = 0, size = 20): Promise<ApiResponse<PageResponse<ChatRoom>>> {
  return api.get<PageResponse<ChatRoom>>(`/v1/admin/chat/rooms?page=${page}&size=${size}`);
}

export function adminJoinRoom(roomId: string): Promise<ApiResponse<ChatRoom>> {
  return api.patch<ChatRoom>(`/v1/admin/chat/rooms/${roomId}/join`);
}

export function adminCloseRoom(roomId: string): Promise<ApiResponse<ChatRoom>> {
  return api.patch<ChatRoom>(`/v1/admin/chat/rooms/${roomId}/close`);
}

export function getAdminRoomMessages(roomId: string): Promise<ApiResponse<ChatMessage[]>> {
  return api.get<ChatMessage[]>(`/v1/admin/chat/rooms/${roomId}/messages`);
}
