import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Mark } from "../../components/brand/BrandMark";
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
    <div className="grid gap-12 py-4 md:min-h-[68vh] md:grid-cols-2 md:items-center md:gap-16 md:py-10">
      <section className="max-w-md">
        <Mark size="md" />
        <h1 className="mt-8 text-4xl leading-[1.08] md:text-5xl">{t("home.hero.title")}</h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
          {t("home.hero.subtitle")}
        </p>
      </section>

      <section className="w-full max-w-md border border-border p-6 md:justify-self-end md:p-8">
        <h2>{t("login.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("login.description")}</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(v === true)}
            />
            <Label htmlFor="remember-me" className="cursor-pointer text-sm font-normal">
              {t("login.rememberMe")}
            </Label>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
          >
            {t("login.signupLink")}
          </Link>
        </p>
      </section>
    </div>
  );
}
