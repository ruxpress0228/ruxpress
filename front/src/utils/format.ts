import type { Locale } from './constants';

const LOCALE_TAGS: Record<Locale, string> = {
  ko: 'ko-KR',
  ru: 'ru-RU',
  en: 'en-US',
};

export function localeToTag(locale: Locale): string {
  return LOCALE_TAGS[locale] ?? 'en-US';
}

export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tag = localeToTag(locale);
  return d.toLocaleDateString(tag, options);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const tag = localeToTag(locale);
  return value.toLocaleString(tag, options);
}
