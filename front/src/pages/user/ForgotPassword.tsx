import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t("forgotPassword.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("forgotPassword.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t("forgotPassword.emailLabel")}</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
            </Button>
            <div className="text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                {t("forgotPassword.backToLogin")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
