import ko from './ko.json';
import ru from './ru.json';
import en from './en.json';
import { STORAGE_KEYS } from '../utils/constants';
import type { Locale } from '../utils/constants';

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = { ko, ru, en };

let currentLocale: Locale = (localStorage.getItem(STORAGE_KEYS.LOCALE) as Locale) || 'ru';

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
}

/** Look up message for a specific locale (used by I18nProvider and tests). */
export function translate(key: string, locale: Locale): string {
  return messages[locale]?.[key] ?? key;
}

export function t(key: string): string {
  return translate(key, currentLocale);
}
