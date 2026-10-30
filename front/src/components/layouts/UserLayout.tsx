import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
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
  Menu,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import { cn } from "../ui/utils";
import { Wordmark } from "../brand/BrandMark";
import { AuthGateProvider, useAuthGate } from "../auth/AuthGate";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap, formatCrossRateLine } from "../../utils/exchange";
import { LOCALES, STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import { clearUserSession, readAuthValue } from "../../utils/api";
import { loginPath } from "../../utils/auth";
import type { CurrentExchangeRates } from "../../utils/exchange";

type NavItem = {
  nameKey: string;
  path: string;
  icon: LucideIcon;
  /** Reachable without an account. */
  public?: boolean;
  /** Shown in the phone tab bar (six slots). */
  tab?: boolean;
  /** Also shown beside the menu button on wide screens. */
  quick?: boolean;
};

const NAVIGATION: NavItem[] = [
  { nameKey: "nav.home", path: "/", icon: Home, public: true, tab: true },
  { nameKey: "nav.products", path: "/products", icon: Tag, public: true, tab: true, quick: true },
  { nameKey: "nav.purchase", path: "/purchase", icon: ShoppingCart, tab: true, quick: true },
  { nameKey: "nav.inquiry", path: "/inquiry", icon: MessageSquare, tab: true },
  { nameKey: "nav.notice", path: "/notice", icon: FileText, public: true },
  { nameKey: "nav.bankTransfer", path: "/bank-transfer", icon: Landmark, tab: true },
  { nameKey: "nav.chat", path: "/chat", icon: MessageCircle, tab: true },
];

const ANNOUNCEMENT_INTERVAL_MS = 7000;

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
  const { getCurrentExchangeRates } = useExchangeRate();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [, setAuthRevision] = useState(0);
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);
  const [announcement, setAnnouncement] = useState(0);

  useEffect(() => {
    const syncAuth = () => setAuthRevision((n) => n + 1);
    window.addEventListener(USER_AUTH_CHANGE_EVENT, syncAuth);
    return () => window.removeEventListener(USER_AUTH_CHANGE_EVENT, syncAuth);
  }, []);

  useEffect(() => {
    setAuthRevision((n) => n + 1);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRates)
      .catch(() => setRates(null));
  }, [getCurrentExchangeRates]);

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

  /** The thin line above the header: today's rate and the service in one sentence, in turn. */
  const announcements = useMemo(() => {
    const items: { key: string; node: ReactNode; to?: string }[] = [];
    const rateMap = buildRateMap(rates?.quotes);
    const rateLine = rates && rates.quotes.length > 0 ? formatCrossRateLine("RUB", "KRW", rateMap, locale, 1) : null;
    if (rateLine) {
      items.push({
        key: "rate",
        to: "/#exchange",
        node: (
          <>
            <span className="text-muted-foreground">{t("landing.rate.today")}</span> <span className="figure">{rateLine}</span>
          </>
        ),
      });
    }
    items.push({ key: "tagline", node: t("announce.tagline"), to: isLoggedIn ? "/purchase/new" : "/products" });
    return items;
  }, [rates, locale, t, isLoggedIn]);

  useEffect(() => {
    if (announcements.length < 2) return;
    const handle = window.setInterval(
      () => setAnnouncement((i) => (i + 1) % announcements.length),
      ANNOUNCEMENT_INTERVAL_MS,
    );
    return () => window.clearInterval(handle);
  }, [announcements.length]);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const currentPath = `${location.pathname}${location.search}`;

  const handleLogout = () => {
    clearUserSession();
    setMenuOpen(false);
    navigate("/");
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "eyebrow whitespace-nowrap py-1 transition-colors",
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
        <button
          key={item.path}
          type="button"
          onClick={() => {
            setMenuOpen(false);
            requireLogin(item.path);
          }}
          className={className}
        >
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

  const shown = announcements[announcement % Math.max(announcements.length, 1)];

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      {/* Announcement line */}
      {shown ? (
        <div className="border-b border-border bg-muted">
          <div className="mx-auto flex h-9 max-w-6xl items-center justify-center gap-2 px-5 text-[11px] tracking-[0.12em] md:px-6">
            {announcements.length > 1 ? (
              <button
                type="button"
                aria-label={t("admin.common.prev")}
                onClick={() => setAnnouncement((i) => (i - 1 + announcements.length) % announcements.length)}
                className="p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
              </button>
            ) : null}
            {shown.to ? (
              <Link to={shown.to} className="truncate uppercase transition-colors hover:text-foreground">
                {shown.node}
              </Link>
            ) : (
              <span className="truncate uppercase">{shown.node}</span>
            )}
            {announcements.length > 1 ? (
              <button
                type="button"
                aria-label={t("admin.common.next")}
                onClick={() => setAnnouncement((i) => (i + 1) % announcements.length)}
                className="p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight className="size-3.5" strokeWidth={1.5} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Header: menu and quick links left, wordmark centred, account right */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-20">
            <div className="flex items-center gap-6 justify-self-start">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={t("nav.menuOpen")}
                aria-expanded={menuOpen}
                className="flex items-center gap-2 py-1 text-foreground transition-opacity hover:opacity-70"
              >
                <Menu className="size-5" strokeWidth={1.25} aria-hidden />
                <span className="eyebrow hidden sm:inline">{t("nav.menu")}</span>
              </button>
              <nav aria-label={t("nav.menu")} className="hidden items-center gap-6 lg:flex">
                {NAVIGATION.filter((item) => item.quick).map((item) =>
                  renderNavItem(item, navLinkClass(isActive(item.path)), t(item.nameKey)),
                )}
              </nav>
            </div>

            <Link to="/" className="justify-self-center" aria-label={t("nav.home")}>
              <Wordmark size="lg" className="text-[15px] md:text-[18px]" />
            </Link>

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
                  <Globe className="size-[18px]" strokeWidth={1.25} aria-hidden />
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

              {isLoggedIn ? (
                <>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/mypage" title={t("nav.myPage")} aria-label={t("nav.myPage")}>
                      <User className="size-[18px]" strokeWidth={1.25} aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title={t("nav.admin.logout")}>
                    <LogOut className="size-[18px]" strokeWidth={1.25} aria-hidden />
                  </Button>
                </>
              ) : (
                <Link to={loginPath(currentPath)} className={cn(navLinkClass(isActive("/login")), "px-2")}>
                  <span className="hidden sm:inline">{t("nav.login")}</span>
                  <User className="size-[18px] sm:hidden" strokeWidth={1.25} aria-label={t("nav.login")} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* The menu: every destination in large, light type */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
          <SheetDescription className="sr-only">{t("footer.tagline")}</SheetDescription>
          <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6 md:px-10">
            <Wordmark size="sm" />
            <nav aria-label={t("nav.menu")} className="mt-12">
              <ul className="space-y-1">
                {NAVIGATION.map((item) => (
                  <li key={item.path}>
                    {renderNavItem(
                      item,
                      cn(
                        "block w-full py-2 text-left text-2xl font-light tracking-[0.02em] transition-colors md:text-3xl",
                        isActive(item.path) ? "text-foreground" : "text-foreground/60 hover:text-foreground",
                      ),
                      t(item.nameKey),
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto space-y-6 pt-12">
              <div className="flex flex-wrap gap-x-5 gap-y-2" role="group" aria-label={t("common.language")}>
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    aria-pressed={locale === loc}
                    onClick={() => setLocale(loc)}
                    className={cn("eyebrow transition-colors", locale === loc ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground")}
                  >
                    {t(`locale.${loc}`)}
                  </button>
                ))}
              </div>
              {isLoggedIn ? (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Link to="/mypage" className="eyebrow text-muted-foreground transition-colors hover:text-foreground">
                    {userNickname ?? t("nav.myPage")}
                  </Link>
                  <button type="button" onClick={handleLogout} className="eyebrow text-muted-foreground transition-colors hover:text-foreground">
                    {t("nav.admin.logout")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild>
                    <Link to="/signup">{t("landing.cta.start")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={loginPath(currentPath)}>{t("nav.login")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main className={cn("mx-auto w-full max-w-6xl flex-1 px-5 pt-8 md:px-6 md:pb-16 md:pt-10", isLoggedIn ? "pb-24" : "pb-12")}>
        <Outlet />
      </main>

      {/* Members get the phone tab bar; guests use the menu */}
      {isLoggedIn ? (
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
      ) : null}

      {/* Footer: a grey band with the brand statement and the links */}
      <footer className="border-t border-border bg-muted">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12 md:px-6 md:py-20">
          <div>
            <p className="eyebrow text-muted-foreground">{t("footer.aboutTitle")}</p>
            <Wordmark size="sm" className="mt-5 block" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("footer.about")}</p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">{t("footer.support")}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li>
                <Link to="/notice" className="transition-colors hover:text-muted-foreground">
                  {t("nav.notice")}
                </Link>
              </li>
              <li>
                {isLoggedIn ? (
                  <Link to="/inquiry" className="transition-colors hover:text-muted-foreground">
                    {t("nav.inquiry")}
                  </Link>
                ) : (
                  <button type="button" onClick={() => requireLogin("/inquiry")} className="transition-colors hover:text-muted-foreground">
                    {t("nav.inquiry")}
                  </button>
                )}
              </li>
              <li>
                {isLoggedIn ? (
                  <Link to="/chat" className="transition-colors hover:text-muted-foreground">
                    {t("nav.chat")}
                  </Link>
                ) : (
                  <button type="button" onClick={() => requireLogin("/chat")} className="transition-colors hover:text-muted-foreground">
                    {t("nav.chat")}
                  </button>
                )}
              </li>
              <li className="pt-2 text-xs text-muted-foreground">{t("footer.hours")}</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">{t("footer.account")}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li>
                <Link to="/products" className="transition-colors hover:text-muted-foreground">
                  {t("nav.products")}
                </Link>
              </li>
              {isLoggedIn ? (
                <>
                  <li>
                    <Link to="/purchase" className="transition-colors hover:text-muted-foreground">
                      {t("nav.purchase")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/mypage" className="transition-colors hover:text-muted-foreground">
                      {t("nav.myPage")}
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to={loginPath(currentPath)} className="transition-colors hover:text-muted-foreground">
                      {t("nav.login")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/signup" className="transition-colors hover:text-muted-foreground">
                      {t("landing.cta.start")}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-10 text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:px-6">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.tagline")}</span>
        </div>
      </footer>
    </div>
  );
}
