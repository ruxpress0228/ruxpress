import { api } from '@/utils/api';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { unwrap } from '@/utils/exception';
import type { ApiResponse, PageResponse } from '@/types/api';
import type { ChatRoom, ChatMessage, ChatCleanupSettings, ChatRetentionPeriod } from '@/types/chat';

export function getOrCreateRoom(): Promise<ApiResponse<ChatRoom>> {
  return api.post<ChatRoom>('/v1/chat/rooms');
}

export function getMyChatRooms(): Promise<ApiResponse<ChatRoom[]>> {
  return api.get<ChatRoom[]>('/v1/chat/rooms');
}

export function getChatMessages(roomId: string): Promise<ApiResponse<ChatMessage[]>> {
  return api.get<ChatMessage[]>(`/v1/chat/rooms/${roomId}/messages`);
}

export function uploadChatAttachment(roomId: string, file: File, caption?: string): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append('file', file);
  if (caption?.trim()) formData.append('caption', caption.trim());
  return api.upload<ChatMessage>(`/v1/chat/rooms/${roomId}/attachments`, formData).then(unwrap);
}

export function getAdminChatRooms(page = 0, size = DEFAULT_PAGE_SIZE): Promise<ApiResponse<PageResponse<ChatRoom>>> {
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

export function uploadAdminChatAttachment(roomId: string, file: File, caption?: string): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append('file', file);
  if (caption?.trim()) formData.append('caption', caption.trim());
  return api.upload<ChatMessage>(`/v1/admin/chat/rooms/${roomId}/attachments`, formData).then(unwrap);
}

export function getChatCleanupSettings(): Promise<ApiResponse<ChatCleanupSettings>> {
  return api.get<ChatCleanupSettings>('/v1/admin/chat/cleanup-settings');
}

export function updateChatCleanupSettings(
  retentionPeriod: ChatRetentionPeriod
): Promise<ApiResponse<ChatCleanupSettings>> {
  return api.put<ChatCleanupSettings>('/v1/admin/chat/cleanup-settings', { retentionPeriod });
}
