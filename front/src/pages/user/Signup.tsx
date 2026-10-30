import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { cn } from "../../components/ui/utils";
import { Mark } from "../../components/brand/BrandMark";
import { Field, Steps } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { useTranslation } from "../../hooks/useTranslation";
import { loginPath, readNextParam } from "../../utils/auth";
import {
  LegalConsentSection,
  SIGNUP_LEGAL_AGREED_KEY,
} from "../../components/legal/LegalConsentSection";

type SignupStep = "legal" | "email" | "profile";

const STEP_ORDER: SignupStep[] = ["legal", "email", "profile"];

function initialStep(): SignupStep {
  try {
    return sessionStorage.getItem(SIGNUP_LEGAL_AGREED_KEY) === "true" ? "email" : "legal";
  } catch {
    return "legal";
  }
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const next = readNextParam(location.search);
  const { t } = useTranslation();

  const [step, setStep] = useState<SignupStep>(initialStep);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [privacyViewed, setPrivacyViewed] = useState(false);

  const agreedAll = agreedTerms && agreedPrivacy;
  const canAgreeAll = termsViewed && privacyViewed;

  const toggleAgreeAll = (checked: boolean) => {
    if (checked && !canAgreeAll) {
      toast.error(t("signup.toast.confirmViewBoth"));
      return;
    }
    setAgreedTerms(checked);
    setAgreedPrivacy(checked);
  };
  const handleAgreeTerms = (checked: boolean) => {
    if (checked && !termsViewed) {
      toast.error(t("signup.toast.confirmViewTerms"));
      return;
    }
    setAgreedTerms(checked);
  };
  const handleAgreePrivacy = (checked: boolean) => {
    if (checked && !privacyViewed) {
      toast.error(t("signup.toast.confirmViewPrivacy"));
      return;
    }
    setAgreedPrivacy(checked);
  };

  const proceedFromLegal = () => {
    if (!agreedAll) {
      toast.error(t("signup.toast.confirmViewBoth"));
      return;
    }
    try {
      sessionStorage.setItem(SIGNUP_LEGAL_AGREED_KEY, "true");
    } catch {
      /* ignore */
    }
    setStep("email");
  };

  const sendEmailVerification = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t("login.error.emailRequired"));
      return;
    }
    setEmailSending(true);
    try {
      const res = await api.post<unknown>("/v1/users/email/send-verification", { email: trimmed });
      if (res.code === 200) {
        toast.success(res.message ?? t("signup.toast.emailSent"));
      } else {
        toast.error(res.message ?? t("signup.toast.sendFailed"));
      }
    } catch {
      toast.error(t("signup.toast.sendFailed"));
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t("login.error.emailRequired"));
      return;
    }
    if (!emailCode || emailCode.length !== 6) {
      toast.error(t("signup.toast.codeRequired"));
      return;
    }
    setEmailVerifying(true);
    try {
      const res = await api.post<unknown>("/v1/users/email/verify", {
        email: trimmedEmail,
        code: emailCode,
      });
      if (res.code === 200) {
        setEmailVerified(true);
        setStep("profile");
        toast.success(res.message ?? t("signup.toast.emailVerified"));
      } else {
        toast.error(res.message ?? t("signup.toast.codeInvalid"));
      }
    } catch {
      toast.error(t("signup.toast.verifyFailed"));
    } finally {
      setEmailVerifying(false);
    }
  };

  const submitSignup = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t("login.error.emailRequired"));
      return;
    }
    if (!password || password.length < 8) {
      toast.error(t("signup.toast.passwordTooShort"));
      return;
    }
    if (password !== passwordConfirm) {
      toast.error(t("resetPassword.error.mismatch"));
      return;
    }
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      toast.error(t("signup.toast.nicknameRequired"));
      return;
    }
    const line1 = addressLine1.trim();
    if (!line1) {
      toast.error(t("signup.toast.addressRequired"));
      return;
    }
    setSignupLoading(true);
    try {
      const res = await api.post<unknown>("/v1/users/signup", {
        email: trimmedEmail,
        password,
        nickname: trimmedNickname,
        addressPostalCode: addressPostalCode.trim() || undefined,
        addressLine1: line1,
        addressLine2: addressLine2.trim() || undefined,
      });
      if (res.code === 200) {
        try {
          sessionStorage.removeItem(SIGNUP_LEGAL_AGREED_KEY);
        } catch {
          /* ignore */
        }
        toast.success(res.message ?? t("signup.toast.success"));
        navigate(loginPath(next));
      } else {
        toast.error(res.message ?? t("signup.toast.failed"));
      }
    } catch {
      toast.error(t("signup.toast.failed"));
    } finally {
      setSignupLoading(false);
    }
  };

  const stepTitle =
    step === "legal"
      ? t("signup.step.legalTitle")
      : step === "email"
        ? t("signup.step.emailTitle")
        : t("signup.step.profileTitle");

  const stepDescription =
    step === "legal"
      ? t("signup.step.legalDescription")
      : step === "email"
        ? t("signup.hint")
        : t("signup.description");

  const stepLabels = [
    t("signup.step.legalTitle"),
    t("signup.step.emailTitle"),
    t("signup.step.profileTitle"),
  ];
  const stepIndex = STEP_ORDER.indexOf(step);

  const backButtonClass =
    "inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground";

  return (
    <div className="flex justify-center py-4 md:min-h-[68vh] md:items-center md:py-10">
      <div className={cn("w-full", step === "legal" ? "max-w-lg" : "max-w-md")}>
        <Mark size="md" />
        <h1 className="mt-8">{stepTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stepDescription}</p>
        <Steps className="mt-6" steps={stepLabels} current={stepIndex} />

        <div className="mt-8">
          {step === "legal" && (
            <div className="space-y-6">
              <LegalConsentSection
                agreedTerms={agreedTerms}
                agreedPrivacy={agreedPrivacy}
                termsViewed={termsViewed}
                privacyViewed={privacyViewed}
                onAgreeTerms={handleAgreeTerms}
                onAgreePrivacy={handleAgreePrivacy}
                onToggleAgreeAll={toggleAgreeAll}
                onTermsViewed={() => setTermsViewed(true)}
                onPrivacyViewed={() => setPrivacyViewed(true)}
              />
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={proceedFromLegal}
                disabled={!agreedAll}
              >
                {t("signup.step.legalNext")}
              </Button>
            </div>
          )}

          {step === "email" && (
            <div className="space-y-5">
              <button type="button" className={backButtonClass} onClick={() => setStep("legal")}>
                <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
                {t("signup.step.back")}
              </button>
              <Field htmlFor="signup-email" label={t("signup.emailLabel")}>
                <div className="flex gap-2">
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    className="min-w-0 flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendEmailVerification()}
                    disabled={emailVerified}
                  />
                  {!emailVerified && (
                    <Button type="button" variant="outline" onClick={sendEmailVerification} disabled={emailSending}>
                      {emailSending ? t("signup.verifySending") : t("signup.verify")}
                    </Button>
                  )}
                </div>
              </Field>
              {!emailVerified && (
                <>
                  <Field htmlFor="email-code" label={t("signup.codeLabel")} hint={t("signup.codeValidity")}>
                    <Input
                      id="email-code"
                      placeholder={t("signup.codePlaceholder")}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && verifyEmailCode()}
                    />
                  </Field>
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={verifyEmailCode}
                    disabled={emailVerifying}
                  >
                    {emailVerifying ? t("signup.codeVerifying") : t("signup.codeVerify")}
                  </Button>
                </>
              )}
            </div>
          )}

          {step === "profile" && (
            <div className="space-y-5">
              <button
                type="button"
                className={backButtonClass}
                onClick={() => {
                  setEmailVerified(false);
                  setStep("email");
                }}
              >
                <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
                {t("signup.step.back")}
              </button>
              <Field htmlFor="password" label={t("signup.password")}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field htmlFor="password-confirm" label={t("signup.passwordConfirm")}>
                <Input
                  id="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.passwordConfirmPlaceholder")}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </Field>
              <Field htmlFor="nickname" label={t("signup.nickname")}>
                <Input
                  id="nickname"
                  placeholder={t("signup.nicknamePlaceholder")}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </Field>

              <div className="space-y-5 border-t border-border pt-5">
                <p className="text-sm font-medium">{t("signup.shippingAddress")}</p>
                <Field htmlFor="addr-postal" label={t("signup.postalCode")}>
                  <Input
                    id="addr-postal"
                    placeholder={t("signup.postalCodePlaceholder")}
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    maxLength={10}
                  />
                </Field>
                <Field htmlFor="addr-line1" label={t("signup.addressLine1")}>
                  <Input
                    id="addr-line1"
                    placeholder={t("signup.addressLine1Placeholder")}
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </Field>
                <Field htmlFor="addr-line2" label={t("signup.addressLine2")}>
                  <Input
                    id="addr-line2"
                    placeholder={t("signup.addressLine2Placeholder")}
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitSignup()}
                  />
                </Field>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={submitSignup}
                disabled={signupLoading}
              >
                {signupLoading ? t("signup.submitting") : t("signup.submit")}
              </Button>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {t("signup.haveAccount")}{" "}
          <Link
            to={loginPath(next)}
            className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
          >
            {t("signup.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
