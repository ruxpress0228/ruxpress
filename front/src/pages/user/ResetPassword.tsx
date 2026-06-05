import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t("resetPassword.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("resetPassword.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokenFromUrl ? (
            <p className="text-sm text-center text-gray-600 mb-4">
              {t("resetPassword.invalidLinkNote")}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("resetPassword.newPasswordLabel")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("resetPassword.newPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!tokenFromUrl}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">{t("resetPassword.newPasswordConfirmLabel")}</Label>
              <Input
                id="new-password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={!tokenFromUrl}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading || !tokenFromUrl}>
              {loading ? t("resetPassword.submitting") : t("resetPassword.submit")}
            </Button>
            <div className="text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                {t("resetPassword.backToLogin")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
