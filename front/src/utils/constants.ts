export const API_BASE = '/api';

export const LOCALES = ['ko', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const STORAGE_KEYS = {
  TOKEN: 'ruxpress_token',
  LOCALE: 'ruxpress_locale',
  USER_ID: 'ruxpress_user_id',
  USER_EMAIL: 'ruxpress_user_email',
  USER_NICKNAME: 'ruxpress_user_nickname',
} as const;

/** UserLayout 등에서 로그인/로그아웃 후 헤더를 다시 그리기 위해 사용 */
export const USER_AUTH_CHANGE_EVENT = 'ruxpress:user-auth-change';
