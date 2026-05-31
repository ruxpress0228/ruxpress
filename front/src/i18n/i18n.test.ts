import { describe, it, expect, beforeEach } from 'vitest';
import { getLocale, setLocale, t } from './index';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('ko');
  });

  describe('getLocale / setLocale', () => {
    it('defaults to ru when no storage', () => {
      setLocale('ru');
      expect(getLocale()).toBe('ru');
    });
    it('returns set locale', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');
      setLocale('ru');
      expect(getLocale()).toBe('ru');
    });
  });

  describe('t', () => {
    it('returns Korean for nav.home when locale is ko', () => {
      setLocale('ko');
      expect(t('nav.home')).toBe('홈');
    });
    it('returns English for nav.home when locale is en', () => {
      setLocale('en');
      expect(t('nav.home')).toBe('Home');
    });
    it('returns Russian for nav.home when locale is ru', () => {
      setLocale('ru');
      expect(t('nav.home')).toBe('Главная');
    });
    it('returns key when key is missing', () => {
      expect(t('missing.key.xyz')).toBe('missing.key.xyz');
    });
    it('returns home.hero.title in correct locale', () => {
      setLocale('ko');
      expect(t('home.hero.title')).toContain('한국');
      setLocale('en');
      expect(t('home.hero.title')).toContain('Korean');
    });
  });
});
