import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
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
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t("signup.terms.dialogTitle")}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t("signup.terms.dialogDescription")}</p>
          {inline ? (
            <div
              ref={termsRef}
              className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-gray-50 p-3 whitespace-pre-wrap text-xs text-gray-700"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onTermsViewed();
              }}
            >
              {t("signup.terms.body")}
            </div>
          ) : null}
          <a
            href={t("signup.terms.telegramUrl")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t("signup.terms.telegramLabel")}
          </a>
          {!termsViewed && inline && (
            <p className="mt-1 text-xs text-amber-600">{t("signup.viewRequired")}</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t("signup.privacy.dialogTitle")}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t("signup.privacy.dialogDescription")}</p>
          {inline ? (
            <div
              ref={privacyRef}
              className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-gray-50 p-3 whitespace-pre-wrap text-xs text-gray-700"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) onPrivacyViewed();
              }}
            >
              {t("signup.privacy.body")}
            </div>
          ) : null}
          {!privacyViewed && inline && (
            <p className="mt-1 text-xs text-amber-600">{t("signup.viewRequired")}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree-all"
            checked={agreedAll}
            disabled={!canAgreeAll}
            onCheckedChange={(v) => onToggleAgreeAll(Boolean(v))}
          />
          <Label
            htmlFor="agree-all"
            className={`text-sm font-medium ${canAgreeAll ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
          >
            {t("signup.agreeAll")}
          </Label>
        </div>
        <div className="flex items-center space-x-2 pl-1">
          <Checkbox
            id="agree-terms"
            checked={agreedTerms}
            disabled={!termsViewed}
            onCheckedChange={(v) => onAgreeTerms(Boolean(v))}
          />
          <Label
            htmlFor="agree-terms"
            className={`text-sm ${termsViewed ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
          >
            <span className="text-red-500">{t("signup.required")}</span> {t("signup.agreeTerms")}
          </Label>
        </div>
        <div className="flex items-center space-x-2 pl-1">
          <Checkbox
            id="agree-privacy"
            checked={agreedPrivacy}
            disabled={!privacyViewed}
            onCheckedChange={(v) => onAgreePrivacy(Boolean(v))}
          />
          <Label
            htmlFor="agree-privacy"
            className={`text-sm ${privacyViewed ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
          >
            <span className="text-red-500">{t("signup.required")}</span> {t("signup.agreePrivacy")}
          </Label>
        </div>
      </div>
    </div>
  );
}

export const SIGNUP_LEGAL_AGREED_KEY = "signupLegalAgreed";
