import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useTranslation } from "../../hooks/useTranslation";

type LegalConsentSectionProps = {
  agreedTerms: boolean;
  agreedPrivacy: boolean;
  termsViewed: boolean;
  privacyViewed: boolean;
  onAgreeTerms: (checked: boolean) => void;
  onAgreePrivacy: (checked: boolean) => void;
  onToggleAgreeAll: (checked: boolean) => void;
  onTermsViewed: () => void;
  onPrivacyViewed: () => void;
  inline?: boolean;
};

const TERMS_BODY_ID = "legal-terms-body";
const PRIVACY_BODY_ID = "legal-privacy-body";

const bodyClass =
  "mt-3 max-h-56 overflow-y-auto scroll-mt-24 whitespace-pre-wrap border border-border p-4 text-xs leading-relaxed text-muted-foreground";
const textLinkClass =
  "underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground";

export function LegalConsentSection({
  agreedTerms,
  agreedPrivacy,
  termsViewed,
  privacyViewed,
  onAgreeTerms,
  onAgreePrivacy,
  onToggleAgreeAll,
  onTermsViewed,
  onPrivacyViewed,
  inline = true,
}: LegalConsentSectionProps) {
  const { t } = useTranslation();
  const agreedAll = agreedTerms && agreedPrivacy;
  const canAgreeAll = termsViewed && privacyViewed;
  const termsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = (ref: React.RefObject<HTMLDivElement | null>, mark: () => void) => {
      const el = ref.current;
      if (el && el.scrollHeight <= el.clientHeight + 1) mark();
    };
    check(termsRef, onTermsViewed);
    check(privacyRef, onPrivacyViewed);
  }, [onTermsViewed, onPrivacyViewed]);

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <section>
          <h2>{t("signup.terms.dialogTitle")}</h2>
          {t("signup.terms.dialogDescription") ? (
            <p className="mt-1 text-xs text-muted-foreground">{t("signup.terms.dialogDescription")}</p>
          ) : null}
          {inline ? (
            <div
              id={TERMS_BODY_ID}
              ref={termsRef}
              className={bodyClass}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onTermsViewed();
              }}
            >
              {t("signup.terms.body")}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
            <a
              href={t("signup.terms.telegramUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 ${textLinkClass}`}
            >
              <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
              {t("signup.terms.telegramLabel")}
            </a>
            {!termsViewed && inline && (
              <p className="text-muted-foreground">{t("signup.viewRequired")}</p>
            )}
          </div>
        </section>

        <section>
          <h2>{t("signup.privacy.dialogTitle")}</h2>
          {t("signup.privacy.dialogDescription") ? (
            <p className="mt-1 text-xs text-muted-foreground">{t("signup.privacy.dialogDescription")}</p>
          ) : null}
          {inline ? (
            <div
              id={PRIVACY_BODY_ID}
              ref={privacyRef}
              className={bodyClass}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onPrivacyViewed();
              }}
            >
              {t("signup.privacy.body")}
            </div>
          ) : null}
          {!privacyViewed && inline && (
            <p className="mt-3 text-xs text-muted-foreground">{t("signup.viewRequired")}</p>
          )}
        </section>
      </div>

      <ul className="border-t border-border">
        <li className="flex items-center gap-3 border-b border-foreground py-3.5">
          <Checkbox
            id="agree-all"
            checked={agreedAll}
            disabled={!canAgreeAll}
            onCheckedChange={(v) => onToggleAgreeAll(Boolean(v))}
          />
          <Label htmlFor="agree-all" className="min-w-0 flex-1 cursor-pointer text-sm">
            {t("signup.agreeAll")}
          </Label>
        </li>
        <li className="flex items-center gap-3 border-b border-border py-3.5">
          <Checkbox
            id="agree-terms"
            checked={agreedTerms}
            disabled={!termsViewed}
            onCheckedChange={(v) => onAgreeTerms(Boolean(v))}
          />
          <Label htmlFor="agree-terms" className="min-w-0 flex-1 cursor-pointer text-sm font-normal">
            <span className="text-destructive">{t("signup.required")}</span> {t("signup.agreeTerms")}
          </Label>
          {inline ? (
            <a href={`#${TERMS_BODY_ID}`} className={`shrink-0 text-xs ${textLinkClass}`}>
              {t("admin.common.view")}
            </a>
          ) : null}
        </li>
        <li className="flex items-center gap-3 border-b border-border py-3.5">
          <Checkbox
            id="agree-privacy"
            checked={agreedPrivacy}
            disabled={!privacyViewed}
            onCheckedChange={(v) => onAgreePrivacy(Boolean(v))}
          />
          <Label htmlFor="agree-privacy" className="min-w-0 flex-1 cursor-pointer text-sm font-normal">
            <span className="text-destructive">{t("signup.required")}</span> {t("signup.agreePrivacy")}
          </Label>
          {inline ? (
            <a href={`#${PRIVACY_BODY_ID}`} className={`shrink-0 text-xs ${textLinkClass}`}>
              {t("admin.common.view")}
            </a>
          ) : null}
        </li>
      </ul>
    </div>
  );
}

export const SIGNUP_LEGAL_AGREED_KEY = "signupLegalAgreed";
