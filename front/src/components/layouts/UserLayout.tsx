import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import { Bell, Menu, User, ShoppingCart, MessageSquare, FileText, Home, Globe, LogOut, Landmark, Wallet } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useTranslation } from "../../hooks/useTranslation";
import { useBalance } from "../../hooks/balance/useBalance";
import { formatNumber } from "../../utils/format";
import { LOCALES, STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import { clearUserSession } from "../../utils/api";

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { balance } = useBalance();
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

  const userToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const userNickname = localStorage.getItem(STORAGE_KEYS.USER_NICKNAME);

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

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { nameKey: "nav.home", path: "/", icon: Home },
    { nameKey: "nav.purchase", path: "/purchase", icon: ShoppingCart },
    { nameKey: "nav.wallet", path: "/wallet", icon: Wallet },
    { nameKey: "nav.inquiry", path: "/inquiry", icon: MessageSquare },
    { nameKey: "nav.notice", path: "/notice", icon: FileText },
    { nameKey: "nav.bankTransfer", path: "/bank-transfer", icon: Landmark },
  ];

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ruxpress</span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t(item.nameKey)}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-2">
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
                  <Globe className="w-5 h-5" />
                </Button>
                {langOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 min-w-[10rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg z-[100]"
                    role="listbox"
                  >
                    {LOCALES.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        role="option"
                        aria-selected={locale === loc}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${locale === loc ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900"}`}
                        onClick={() => {
                          setLocale(loc);
                          setLangOpen(false);
                        }}
                      >
                        {t(`locale.${loc}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>
              {userToken ? (
                <div className="flex items-center gap-1 max-w-[14rem]">
                  <Link
                    to="/wallet"
                    className="hidden sm:flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap"
                    title={t("nav.walletBalanceHint")}
                  >
                    {`₩${formatNumber(balance ?? 0, locale, { maximumFractionDigits: 0 })}`}
                  </Link>
                  <span className="hidden sm:inline text-sm text-gray-700 truncate" title={userNickname ?? ""}>
                    {userNickname ?? "회원"}
                  </span>
                  <Link to="/mypage">
                    <Button variant="ghost" size="icon" title="마이페이지">
                      <User className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title={t("nav.admin.logout")}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    로그인
                  </Button>
                </Link>
              )}

              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t("nav.menu")}</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-2 mt-6">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.path} to={item.path}>
                          <Button
                            variant={isActive(item.path) ? "default" : "ghost"}
                            className="w-full justify-start"
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {t(item.nameKey)}
                          </Button>
                        </Link>
                      );
                    })}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("nav.admin.logout")}
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Ruxpress</h3>
              <p className="text-sm text-gray-600">{t("footer.tagline")}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t("footer.support")}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/inquiry" className="hover:text-blue-600">{t("nav.inquiry")}</Link></li>
                <li><Link to="/notice" className="hover:text-blue-600">{t("nav.notice")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t("footer.inquiry")}</h4>
              <p className="text-sm text-gray-600">{t("footer.email")}</p>
              <p className="text-sm text-gray-600">{t("footer.hours")}</p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
