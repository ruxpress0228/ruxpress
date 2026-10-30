import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Mark } from "../../components/brand/BrandMark";
import { Field } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { useTranslation } from "../../hooks/useTranslation";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenFromUrl.trim();
    if (!token) {
      toast.error(t("resetPassword.toast.invalidLink"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("resetPassword.error.tooShort"));
      return;
    }
    if (password !== passwordConfirm) {
      toast.error(t("resetPassword.error.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<unknown>("/v1/users/password/reset", {
        token,
        newPassword: password,
      });
      if (res.code === 200) {
        toast.success(res.message ?? t("resetPassword.toast.success"));
        navigate("/login", { replace: true });
      } else {
        toast.error(res.message ?? t("resetPassword.toast.failed"));
      }
    } catch {
      toast.error(t("resetPassword.toast.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-4 md:min-h-[68vh] md:items-center md:py-10">
      <div className="w-full max-w-md">
        <Mark size="md" />
        <h1 className="mt-8">{t("resetPassword.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("resetPassword.description")}</p>
        {!tokenFromUrl ? (
          <p className="mt-4 text-sm text-destructive">{t("resetPassword.invalidLinkNote")}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field htmlFor="new-password" label={t("resetPassword.newPasswordLabel")}>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder={t("resetPassword.newPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!tokenFromUrl}
            />
          </Field>
          <Field htmlFor="new-password-confirm" label={t("resetPassword.newPasswordConfirmLabel")}>
            <Input
              id="new-password-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={!tokenFromUrl}
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !tokenFromUrl}>
            {loading ? t("resetPassword.submitting") : t("resetPassword.submit")}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
          >
            {t("resetPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
