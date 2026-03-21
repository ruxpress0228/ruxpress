import { describe, it, expect } from 'vitest';
import { localeToTag, formatDate, formatNumber } from './format';

describe('localeToTag', () => {
  it('returns ko-KR for ko', () => {
    expect(localeToTag('ko')).toBe('ko-KR');
  });
  it('returns ru-RU for ru', () => {
    expect(localeToTag('ru')).toBe('ru-RU');
  });
  it('returns en-US for en', () => {
    expect(localeToTag('en')).toBe('en-US');
  });
});

describe('formatDate', () => {
  const date = new Date('2026-03-07T12:00:00Z');

  it('formats date for ko locale', () => {
    const result = formatDate(date, 'ko');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
  it('accepts string date', () => {
    const result = formatDate('2026-03-07', 'en');
    expect(result).toBeTruthy();
  });
  it('uses options when provided', () => {
    const result = formatDate(date, 'ko', { year: 'numeric', month: 'long' });
    expect(result).toBeTruthy();
  });
});

describe('formatNumber', () => {
  it('formats number for locale', () => {
    expect(formatNumber(1234.56, 'ko')).toBeTruthy();
    expect(formatNumber(1234.56, 'en')).toBeTruthy();
  });
  it('uses options when provided', () => {
    const result = formatNumber(1234.5, 'en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    expect(result).toContain('234.50');
  });
});
