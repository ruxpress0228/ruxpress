import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Globe, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { cn } from "../../components/ui/utils";
import { Mark } from "../../components/brand/BrandMark";
import { Field } from "../../components/page";
import { toast } from "sonner";
import { api, notifyUserAuthChange } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { LOCALES, STORAGE_KEYS } from "../../utils/constants";
import { useTranslation } from "../../hooks/useTranslation";

interface LoginResponse {
  token: string;
  adminId: number;
  email: string;
  name: string;
  role: string;
}

export default function AdminLogin() {
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langOpen]);

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
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="absolute right-4 top-4" ref={langRef}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={t("common.language")}
          onClick={() => setLangOpen((v) => !v)}
          aria-expanded={langOpen}
          aria-haspopup="listbox"
        >
          <Globe className="size-[18px]" strokeWidth={1.5} />
        </Button>
        {langOpen && (
          <div
            className="absolute right-0 top-full z-[100] mt-2 min-w-[10rem] border border-border bg-popover py-1"
            role="listbox"
            aria-label={t("common.language")}
          >
            {LOCALES.map((loc) => {
              const selected = locale === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    selected ? "text-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => {
                    setLocale(loc);
                    setLangOpen(false);
                  }}
                >
                  {t(`locale.${loc}`)}
                  {selected ? <Check className="size-3.5" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <main className="flex flex-1 items-center justify-center px-5 py-16 md:px-6">
        <div className="mx-auto w-full max-w-md">
          <Mark size="md" />
          <h1 className="mt-8">{t("admin.login.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.login.subtitle")}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field htmlFor="admin-email" label={t("admin.login.email")}>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@main-proxy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
            <Field htmlFor="admin-password" label={t("admin.login.password")}>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="admin-remember-me" className="cursor-pointer text-sm font-normal">
                {t("admin.login.rememberMe")}
              </Label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("admin.login.submitting") : t("admin.login.submit")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
