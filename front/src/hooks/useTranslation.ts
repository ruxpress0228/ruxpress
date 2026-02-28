import { useState, useCallback } from 'react';
import { t as translate, getLocale, setLocale as setI18nLocale } from '../i18n';
import type { Locale } from '../utils/constants';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const setLocale = useCallback((newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    return translate(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return { t, locale, setLocale };
}
