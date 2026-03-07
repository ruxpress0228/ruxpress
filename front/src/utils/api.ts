import { API_BASE, STORAGE_KEYS } from './constants';
import type { ApiResponse } from '../types';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const locale = localStorage.getItem(STORAGE_KEYS.LOCALE);
  if (locale) {
    headers['Accept-Language'] = locale;
  }

  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  return headers;
}

function getHeadersForUpload(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const locale = localStorage.getItem(STORAGE_KEYS.LOCALE);
  if (locale) headers['Accept-Language'] = locale;
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (userId) headers['X-User-Id'] = userId;
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  return response.json();
}

export const api = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path);
  },

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'DELETE' });
  },

  upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: formData,
      headers: getHeadersForUpload(),
    }).then((res) => res.json());
  },

  async downloadAttachment(attachmentId: number, filename: string): Promise<void> {
    const res = await fetch(`${API_BASE}/v1/inquiries/attachments/${attachmentId}/download`, {
      headers: getHeadersForUpload(),
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    a.click();
    URL.revokeObjectURL(url);
  },
};
