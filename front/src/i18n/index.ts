import ko from './ko.json';
import ru from './ru.json';
import en from './en.json';
import { STORAGE_KEYS } from '../utils/constants';
import type { Locale } from '../utils/constants';

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = { ko, ru, en };

let currentLocale: Locale = (localStorage.getItem(STORAGE_KEYS.LOCALE) as Locale) || 'ko';

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
}

export function t(key: string): string {
  return messages[currentLocale]?.[key] ?? key;
}
