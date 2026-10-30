import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { api, notifyUserAuthChange } from "../../utils/api";
import { STORAGE_KEYS } from "../../utils/constants";
import { useTranslation } from "../../hooks/useTranslation";

interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  nickname: string;
}

type LoginFormProps = {
  /** Called once the session is stored. The caller decides where to go next. */
  onSuccess: () => void;
  /** Prefix for input ids so two forms can coexist on one page. */
  idPrefix?: string;
  autoFocus?: boolean;
};

/** Email + password sign-in. Shared by the login page and the in-place login sheet. */
export function LoginForm({ onSuccess, idPrefix = "login", autoFocus = false }: LoginFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
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
        onSuccess();
      } else {
        toast.error(res.message ?? t("login.toast.failed"));
      }
    } catch {
      toast.error(t("login.toast.failed"));
    } finally {
      setLoading(false);
    }
  };

  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const rememberId = `${idPrefix}-remember`;

  return (
    <form onSubmit={handleLogin} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor={emailId}>{t("login.email")}</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          autoFocus={autoFocus}
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={passwordId}>{t("login.password")}</Label>
          <Link
            to="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={rememberId} checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
        <Label htmlFor={rememberId} className="cursor-pointer text-sm font-normal">
          {t("login.rememberMe")}
        </Label>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
