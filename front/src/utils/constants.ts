export const API_BASE = '/api';

export const LOCALES = ['ko', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const STORAGE_KEYS = {
  TOKEN: 'ruxpress_token',
  LOCALE: 'ruxpress_locale',
} as const;
