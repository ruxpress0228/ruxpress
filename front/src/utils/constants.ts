export const API_BASE = '/api';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

export const LOCALES = ['ru', 'ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';

export const STORAGE_KEYS = {
  TOKEN: 'ruxpress_token',
  LOCALE: 'ruxpress_locale',
  /** 언어 드롭다운에서 사용자가 직접 선택했을 때만 '1' */
  LOCALE_USER_CHOICE: 'ruxpress_locale_user_choice',
  USER_ID: 'ruxpress_user_id',
  USER_EMAIL: 'ruxpress_user_email',
  USER_NICKNAME: 'ruxpress_user_nickname',
  REMEMBER_ME: 'ruxpress_remember_me',
} as const;

/** UserLayout 등에서 로그인/로그아웃 후 헤더를 다시 그리기 위해 사용 */
export const USER_AUTH_CHANGE_EVENT = 'ruxpress:user-auth-change';
/** 지갑 잔액 변동(차감/환급) 후 헤더 잔액 즉시 갱신 */
export const USER_BALANCE_CHANGE_EVENT = 'ruxpress:user-balance-change';
/** 서버에서 잔액이 실제로 바뀐 경우에만 브로드캐스트 */
export const USER_BALANCE_UPDATED_EVENT = 'ruxpress:user-balance-updated';
