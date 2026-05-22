import { API_BASE, STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from './constants';
import type { ApiResponse } from '../types';

export function notifyUserAuthChange(): void {
  window.dispatchEvent(new Event(USER_AUTH_CHANGE_EVENT));
}

/** 자동로그인 체크 시에는 localStorage, 미체크 시에는 sessionStorage 에서 값을 읽는다. */
export function readAuthValue(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

/** 양쪽 스토리지에서 모두 제거 (어느 쪽에 있든 일관되게 정리). */
function removeAuthValue(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

/** 일반 회원 로그인 세션 제거 (관리자와 동일 STORAGE_KEYS.TOKEN 사용 시 주의) */
export function clearUserSession(): void {
  if (typeof window !== 'undefined') {
    window.Android?.clearAuthToken?.();
  }
  removeAuthValue(STORAGE_KEYS.TOKEN);
  removeAuthValue(STORAGE_KEYS.USER_ID);
  removeAuthValue(STORAGE_KEYS.USER_EMAIL);
  removeAuthValue(STORAGE_KEYS.USER_NICKNAME);
  removeAuthValue(STORAGE_KEYS.REMEMBER_ME);
  notifyUserAuthChange();
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = readAuthValue(STORAGE_KEYS.TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const locale = localStorage.getItem(STORAGE_KEYS.LOCALE);
  if (locale) {
    headers['Accept-Language'] = locale;
  }

  const userId = readAuthValue(STORAGE_KEYS.USER_ID);
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  return headers;
}

function getHeadersForUpload(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = readAuthValue(STORAGE_KEYS.TOKEN);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const locale = localStorage.getItem(STORAGE_KEYS.LOCALE);
  if (locale) headers['Accept-Language'] = locale;
  const userId = readAuthValue(STORAGE_KEYS.USER_ID);
  if (userId) headers['X-User-Id'] = userId;
  return headers;
}

function isAuthPath(path: string): boolean {
  // 로그인/회원가입/비번 재설정 등은 401 이 정상 응답일 수 있어 자동 로그아웃에서 제외.
  return (
    path.startsWith('/v1/users/login') ||
    path.startsWith('/v1/users/signup') ||
    path.startsWith('/v1/users/password/') ||
    path.startsWith('/v1/users/email/') ||
    path.startsWith('/v1/admin/auth/')
  );
}

function handleUnauthorizedIfNeeded(path: string, payload: ApiResponse<unknown>): void {
  if (payload?.code !== 401) return;
  if (isAuthPath(path)) return;
  if (typeof window === 'undefined') return;
  if (!readAuthValue(STORAGE_KEYS.TOKEN)) return;

  clearUserSession();
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const target = isAdminPath ? '/admin/login' : '/login';
  if (window.location.pathname !== target) {
    window.location.href = target;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const json = (await response.json()) as ApiResponse<T>;
  handleUnauthorizedIfNeeded(path, json);
  return json;
}

function toFormDataWithJsonAndFiles(
  jsonFieldName: string,
  jsonBody: unknown,
  filesFieldName: string,
  files: File[]
): FormData {
  const formData = new FormData();
  formData.append(
    jsonFieldName,
    new Blob([JSON.stringify(jsonBody)], { type: 'application/json' })
  );
  files.forEach((file) => formData.append(filesFieldName, file));
  return formData;
}

export const api = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path);
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: {
      multipart?: {
        /** 서버 @RequestPart JSON 파트 이름 (ex: "purchaseReq", "inquiryReq") */
        jsonFieldName: string;
        /** 서버 @RequestPart 파일 파트 이름 (기본값: "files") */
        filesFieldName?: string;
      };
    }
  ): Promise<ApiResponse<T>> {
    // 기존 사용처는 options 없이 그대로 JSON POST로 동작
    if (body instanceof FormData) {
      return api.upload<T>(path, body);
    }

    const multipart = options?.multipart;
    if (multipart) {
      const filesFieldName = multipart.filesFieldName ?? 'files';
      const filesFromBody = Array.isArray((body as { files?: unknown })?.files)
        ? (((body as { files?: unknown }).files as unknown[]) ?? []).filter(Boolean)
        : [];
      const files = filesFromBody.filter((f): f is File => f instanceof File);

      if (files.length > 0) {
        const payload = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { files: _files, ...jsonPayload } = payload;
        const formData = toFormDataWithJsonAndFiles(multipart.jsonFieldName, jsonPayload, filesFieldName, files);
        return api.upload<T>(path, formData);
      }
    }

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
    })
      .then((res) => res.json() as Promise<ApiResponse<T>>)
      .then((json) => {
        handleUnauthorizedIfNeeded(path, json);
        return json;
      });
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
