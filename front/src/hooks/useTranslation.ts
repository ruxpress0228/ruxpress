import { useI18n } from "../i18n/I18nProvider";

/** Shared locale + translations via React Context (updates all consumers without refresh). */
export function useTranslation() {
  return useI18n();
}
