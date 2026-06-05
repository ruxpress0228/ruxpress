import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { api, notifyUserAuthChange } from "../../utils/api";
import { STORAGE_KEYS } from "../../utils/constants";
import { useTranslation } from "../../hooks/useTranslation";

interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  nickname: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t("login.error.emailRequired"));
      return;
    }
    if (!password) {
      toast.error(t("login.error.passwordRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/v1/users/login", {
        email: trimmedEmail,
        password,
      });
      if (res.code === 200 && res.data?.token) {
        const storage: Storage = rememberMe ? localStorage : sessionStorage;
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        sessionStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
        sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
        localStorage.removeItem(STORAGE_KEYS.USER_NICKNAME);
        sessionStorage.removeItem(STORAGE_KEYS.USER_NICKNAME);

        storage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
        storage.setItem(STORAGE_KEYS.USER_ID, String(res.data.userId));
        storage.setItem(STORAGE_KEYS.USER_EMAIL, res.data.email);
        storage.setItem(STORAGE_KEYS.USER_NICKNAME, res.data.nickname);
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "1");
        } else {
          localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        }
        window.Android?.setAuthToken?.(
          JSON.stringify({
            token: res.data.token,
            userId: res.data.userId,
            email: res.data.email,
            nickname: res.data.nickname,
          }),
        );
        notifyUserAuthChange();
        toast.success(res.message ?? t("login.toast.success"));
        navigate("/");
      } else {
        toast.error(res.message ?? t("login.toast.failed"));
      }
    } catch {
      toast.error(t("login.toast.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold tracking-tight">MP</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t("login.title")}</CardTitle>
          <CardDescription className="text-center">{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Button variant="link" className="px-0 h-auto text-sm" asChild>
                  <Link to="/forgot-password">{t("login.forgotPassword")}</Link>
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                {t("login.rememberMe")}
              </Label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            {t("login.noAccount")}{" "}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              {t("login.signupLink")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
