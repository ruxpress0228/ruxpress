import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  User,
  ShoppingCart,
  MessageSquare,
  FileText,
  Home,
  Globe,
  LogOut,
  Landmark,
  MessageCircle,
  Check,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { Wordmark } from "../brand/BrandMark";
import { AuthGateProvider, useAuthGate } from "../auth/AuthGate";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES, STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import { clearUserSession, readAuthValue } from "../../utils/api";
import { loginPath } from "../../utils/auth";

type NavItem = {
  nameKey: string;
  path: string;
  icon: LucideIcon;
  /** Reachable without an account. */
  public?: boolean;
  /** Shown in the phone tab bar (six slots). */
  tab?: boolean;
};

const NAVIGATION: NavItem[] = [
  { nameKey: "nav.home", path: "/", icon: Home, public: true, tab: true },
  { nameKey: "nav.products", path: "/products", icon: Tag, public: true, tab: true },
  { nameKey: "nav.purchase", path: "/purchase", icon: ShoppingCart, tab: true },
  { nameKey: "nav.inquiry", path: "/inquiry", icon: MessageSquare, tab: true },
  { nameKey: "nav.notice", path: "/notice", icon: FileText, public: true },
  { nameKey: "nav.bankTransfer", path: "/bank-transfer", icon: Landmark, tab: true },
  { nameKey: "nav.chat", path: "/chat", icon: MessageCircle, tab: true },
];

export default function UserLayout() {
  return (
    <AuthGateProvider>
      <UserShell />
    </AuthGateProvider>
  );
}

function UserShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { isLoggedIn, requireLogin } = useAuthGate();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [, setAuthRevision] = useState(0);

  useEffect(() => {
    const syncAuth = () => setAuthRevision((n) => n + 1);
    window.addEventListener(USER_AUTH_CHANGE_EVENT, syncAuth);
    return () => window.removeEventListener(USER_AUTH_CHANGE_EVENT, syncAuth);
  }, []);

  useEffect(() => {
    setAuthRevision((n) => n + 1);
  }, [location.pathname]);

  const userNickname = readAuthValue(STORAGE_KEYS.USER_NICKNAME);

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

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const currentPath = `${location.pathname}${location.search}`;

  /** The wordmark already links home, so the text navigation skips it. */
  const textNavigation = NAVIGATION.filter((item) => item.path !== "/");

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "whitespace-nowrap py-1 text-sm font-medium transition-colors",
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  /**
   * Guests reach public pages directly; member features open the login sheet
   * and continue to the feature after signing in.
   */
  const renderNavItem = (item: NavItem, className: string, children: ReactNode) => {
    const active = isActive(item.path);
    const gated = !isLoggedIn && !item.public;
    if (gated) {
      return (
        <button key={item.path} type="button" onClick={() => requireLogin(item.path)} className={className}>
          {children}
        </button>
      );
    }
    return (
      <Link key={item.path} to={item.path} aria-current={active ? "page" : undefined} className={className}>
        {children}
      </Link>
    );
  };

  const renderTextNav = () =>
    textNavigation.map((item) => renderNavItem(item, navLinkClass(isActive(item.path)), t(item.nameKey)));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
            <Link to="/" className="justify-self-start" aria-label={t("nav.home")}>
              <Wordmark />
            </Link>

            <nav
              aria-label={t("nav.menu")}
              className="hidden min-w-0 items-center justify-center gap-6 lg:flex xl:gap-8"
            >
              {renderTextNav()}
            </nav>

            <div className="flex items-center justify-end gap-0.5">
              <div className="relative" ref={langRef}>
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
                    className="absolute right-0 top-full z-[100] mt-2 min-w-[10rem] rounded-2xl border border-border bg-popover p-1.5 shadow-lg"
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
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
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

              {isLoggedIn ? (
                <div className="flex items-center gap-0.5">
                  <span
                    className="hidden max-w-[9rem] truncate px-2 text-sm text-muted-foreground sm:inline"
                    title={userNickname ?? ""}
                  >
                    {userNickname ?? t("nav.memberFallback")}
                  </span>
                  <Link to="/mypage">
                    <Button variant="ghost" size="icon" title={t("nav.myPage")}>
                      <User className="size-[18px]" strokeWidth={1.5} />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title={t("nav.admin.logout")}>
                    <LogOut className="size-[18px]" strokeWidth={1.5} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to={loginPath(currentPath)} className={cn(navLinkClass(isActive("/login")), "px-2")}>
                    {t("nav.login")}
                  </Link>
                  <Button size="sm" asChild>
                    <Link to="/signup">{t("landing.cta.start")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <nav
            aria-label={t("nav.menu")}
            className="-mx-5 hidden h-11 items-center gap-6 overflow-x-auto px-5 md:flex lg:hidden [scrollbar-width:none]"
          >
            {renderTextNav()}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-8 md:px-6 md:pb-16 md:pt-10">
        <Outlet />
      </main>

      <nav
        aria-label={t("nav.menu")}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-6">
          {NAVIGATION.filter((item) => item.tab).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                {renderNavItem(
                  item,
                  cn(
                    "flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] leading-none transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  ),
                  <>
                    <Icon className="size-5" strokeWidth={active ? 2 : 1.5} />
                    <span className="max-w-full truncate px-1">{t(item.nameKey)}</span>
                  </>,
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[2fr_1fr_1fr] md:px-6">
          <div>
            <Wordmark size="sm" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">{t("footer.support")}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                {isLoggedIn ? (
                  <Link to="/inquiry" className="transition-colors hover:text-foreground">
                    {t("nav.inquiry")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => requireLogin("/inquiry")}
                    className="transition-colors hover:text-foreground"
                  >
                    {t("nav.inquiry")}
                  </button>
                )}
              </li>
              <li>
                <Link to="/notice" className="transition-colors hover:text-foreground">
                  {t("nav.notice")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">{t("footer.inquiry")}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("footer.hours")}</p>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-10 text-xs text-muted-foreground md:px-6">
          {t("footer.copyright")}
        </div>
      </footer>
    </div>
  );
}
