import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { useTranslation } from "../../hooks/useTranslation";
import {
  LegalConsentSection,
  SIGNUP_LEGAL_AGREED_KEY,
} from "../../components/legal/LegalConsentSection";

type SignupStep = "legal" | "email" | "profile";

function initialStep(): SignupStep {
  try {
    return sessionStorage.getItem(SIGNUP_LEGAL_AGREED_KEY) === "true" ? "email" : "legal";
  } catch {
    return "legal";
  }
}

export default function Signup() {
  const navigate = useNavigate();
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
        navigate("/login");
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className={`w-full ${step === "legal" ? "max-w-lg" : "max-w-md"}`}>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold tracking-tight">MP</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{stepTitle}</CardTitle>
          <CardDescription className="text-center">{stepDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "legal" && (
            <>
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
            </>
          )}

          {step === "email" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0 text-gray-500"
                onClick={() => setStep("legal")}
              >
                ← {t("signup.step.back")}
              </Button>
              <div className="space-y-2">
                <Label htmlFor="signup-email">{t("signup.emailLabel")}</Label>
                <div className="flex space-x-2">
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    className="flex-1"
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
              </div>
              {!emailVerified && (
                <div className="space-y-2">
                  <Label htmlFor="email-code">{t("signup.codeLabel")}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="email-code"
                      placeholder={t("signup.codePlaceholder")}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && verifyEmailCode()}
                      className="flex-1"
                    />
                    <Button type="button" onClick={verifyEmailCode} disabled={emailVerifying}>
                      {emailVerifying ? t("signup.codeVerifying") : t("signup.codeVerify")}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">{t("signup.codeValidity")}</p>
                </div>
              )}
            </>
          )}

          {step === "profile" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0 text-gray-500"
                onClick={() => {
                  setEmailVerified(false);
                  setStep("email");
                }}
              >
                ← {t("signup.step.back")}
              </Button>
              <div className="space-y-2">
                <Label htmlFor="password">{t("signup.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-confirm">{t("signup.passwordConfirm")}</Label>
                <Input
                  id="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.passwordConfirmPlaceholder")}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">{t("signup.nickname")}</Label>
                <Input
                  id="nickname"
                  placeholder={t("signup.nicknamePlaceholder")}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <Separator className="my-2" />
              <p className="text-sm font-medium text-gray-800">{t("signup.shippingAddress")}</p>
              <div className="space-y-2">
                <Label htmlFor="addr-postal">{t("signup.postalCode")}</Label>
                <Input
                  id="addr-postal"
                  placeholder={t("signup.postalCodePlaceholder")}
                  value={addressPostalCode}
                  onChange={(e) => setAddressPostalCode(e.target.value)}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line1">{t("signup.addressLine1")}</Label>
                <Input
                  id="addr-line1"
                  placeholder={t("signup.addressLine1Placeholder")}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line2">{t("signup.addressLine2")}</Label>
                <Input
                  id="addr-line2"
                  placeholder={t("signup.addressLine2Placeholder")}
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSignup()}
                />
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
            </>
          )}

          <div className="text-center text-sm text-gray-600 mt-6">
            {t("signup.haveAccount")}{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              {t("signup.loginLink")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
