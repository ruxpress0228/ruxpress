import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Mark } from "../../components/brand/BrandMark";
import { Field } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { useTranslation } from "../../hooks/useTranslation";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t("login.error.emailRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<unknown>("/v1/users/password/forgot", { email: trimmed });
      if (res.code === 200) {
        toast.success(res.message ?? t("forgotPassword.toast.sent"));
      } else {
        toast.error(res.message ?? t("forgotPassword.toast.failed"));
      }
    } catch {
      toast.error(t("forgotPassword.toast.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-4 md:min-h-[68vh] md:items-center md:py-10">
      <div className="w-full max-w-md">
        <Mark size="md" />
        <h1 className="mt-8">{t("forgotPassword.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("forgotPassword.description")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field htmlFor="forgot-email" label={t("forgotPassword.emailLabel")}>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
