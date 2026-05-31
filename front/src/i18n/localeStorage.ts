import { DEFAULT_LOCALE, STORAGE_KEYS, type Locale } from "../utils/constants";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ko" || value === "ru" || value === "en";
}

/** 저장된 locale 읽기 — 사용자가 직접 고른 경우에만 복원, 아니면 DEFAULT_LOCALE */
export function readStoredLocale(): Locale {
  try {
    const userChoice = localStorage.getItem(STORAGE_KEYS.LOCALE_USER_CHOICE) === "1";
    const raw = localStorage.getItem(STORAGE_KEYS.LOCALE);
    if (userChoice && isLocale(raw)) return raw;
  } catch {
    // ignore (private mode 등)
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale, options?: { userChoice?: boolean }): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
    if (options?.userChoice) {
      localStorage.setItem(STORAGE_KEYS.LOCALE_USER_CHOICE, "1");
    }
  } catch {
    // ignore
  }
}
