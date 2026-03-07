import { API_BASE, STORAGE_KEYS } from './constants';
import type { ApiResponse } from '../types';
import type { ExchangeRate } from '../types';

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
};

// Exchange rate API (returns data or throws)
const EXCHANGE_BASE = '/v1/exchange-rates';

export async function getCurrentExchangeRate(): Promise<ExchangeRate> {
  const res = await api.get<ExchangeRate>(`${EXCHANGE_BASE}/current`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || 'Failed to load exchange rate');
  return res.data;
}

export async function getExchangeRateHistory(page = 0, size = 20): Promise<{ content: ExchangeRate[]; totalElements: number; totalPages: number; number: number; size: number }> {
  const res = await api.get<{ content: ExchangeRate[]; totalElements: number; totalPages: number; number: number; size: number }>(
    `${EXCHANGE_BASE}?page=${page}&size=${size}`
  );
  if (res.code !== 200 || res.data == null) throw new Error(res.message || 'Failed to load exchange rate history');
  return res.data;
}

export async function triggerExchangeRateFetch(): Promise<ExchangeRate> {
  const res = await api.post<ExchangeRate>(`${EXCHANGE_BASE}/fetch`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || 'Failed to fetch exchange rate');
  return res.data;
}

export async function setManualExchangeRate(rate: number): Promise<ExchangeRate> {
  const res = await api.post<ExchangeRate>(`${EXCHANGE_BASE}/manual`, { rate });
  if (res.code !== 200 || res.data == null) throw new Error(res.message || 'Failed to set manual exchange rate');
  return res.data;
}
