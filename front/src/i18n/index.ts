import ko from './ko.json';
import ru from './ru.json';
import en from './en.json';
import { DEFAULT_LOCALE } from '../utils/constants';
import type { Locale } from '../utils/constants';
import { persistLocale, readStoredLocale } from './localeStorage';

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = { ko, ru, en };

let currentLocale: Locale = DEFAULT_LOCALE;

if (typeof window !== 'undefined') {
  currentLocale = readStoredLocale();
}

export function getLocale(): Locale {
  return currentLocale;
}

/** I18nProvider 마운트 시 호출 — 저장값 없으면 기본 locale 을 localStorage 에 기록 */
export function ensureLocaleInitialized(): Locale {
  const resolved = readStoredLocale();
  currentLocale = resolved;
  persistLocale(resolved);
  return resolved;
}

export function setLocale(locale: Locale, options?: { userChoice?: boolean }): void {
  currentLocale = locale;
  persistLocale(locale, options);
}

function applyVars(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

/** Look up message for a specific locale (used by I18nProvider and tests). */
export function translate(key: string, locale: Locale, vars?: Record<string, string | number>): string {
  return applyVars(messages[locale]?.[key] ?? key, vars);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  return translate(key, currentLocale, vars);
}
