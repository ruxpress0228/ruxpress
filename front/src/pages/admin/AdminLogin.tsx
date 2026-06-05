import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { api, notifyUserAuthChange } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { STORAGE_KEYS } from "../../utils/constants";
import { useTranslation } from "../../hooks/useTranslation";

interface LoginResponse {
  token: string;
  adminId: number;
  email: string;
  name: string;
  role: string;
}

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/v1/admin/auth/login", { email, password });
      const data = unwrap(res);
      const storage: Storage = rememberMe ? localStorage : sessionStorage;
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem("ruxpress_admin");
      sessionStorage.removeItem("ruxpress_admin");

      storage.setItem(STORAGE_KEYS.TOKEN, data.token);
      storage.setItem("ruxpress_admin", JSON.stringify({
        id: data.adminId,
        email: data.email,
        name: data.name,
        role: data.role,
      }));
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "1");
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
      notifyUserAuthChange();
      toast.success(t("admin.login.welcome", { name: data.name }));
      navigate("/admin");
    } catch {
      toast.error(t("admin.login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t("admin.login.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("admin.login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">{t("admin.login.email")}</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@main-proxy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">{t("admin.login.password")}</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin-remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="admin-remember-me" className="text-sm font-normal cursor-pointer">
                {t("admin.login.rememberMe")}
              </Label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("admin.login.submitting") : t("admin.login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
