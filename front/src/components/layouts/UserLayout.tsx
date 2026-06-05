import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import { Bell, User, ShoppingCart, MessageSquare, FileText, Home, Globe, LogOut, Landmark, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES, STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import { clearUserSession, readAuthValue } from "../../utils/api";

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
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

  const userToken = readAuthValue(STORAGE_KEYS.TOKEN);
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

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { nameKey: "nav.home", path: "/", icon: Home },
    { nameKey: "nav.purchase", path: "/purchase", icon: ShoppingCart },
    { nameKey: "nav.inquiry", path: "/inquiry", icon: MessageSquare },
    { nameKey: "nav.notice", path: "/notice", icon: FileText },
    { nameKey: "nav.bankTransfer", path: "/bank-transfer", icon: Landmark },
    { nameKey: "nav.chat", path: "/chat", icon: MessageCircle },
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
                <span className="text-white text-xs font-bold tracking-tight">MP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Main-Proxy</span>
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
              <Button variant="ghost" size="icon" className="relative hidden">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>
              {userToken ? (
                <div className="flex items-center gap-1 max-w-[14rem]">
                  <span className="hidden sm:inline text-sm text-gray-700 truncate" title={userNickname ?? ""}>
                    {userNickname ?? t("nav.memberFallback")}
                  </span>
                  <Link to="/mypage">
                    <Button variant="ghost" size="icon" title={t("nav.myPage")}>
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
                    {t("nav.login")}
                  </Button>
                </Link>
              )}

            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-50 border-t border-gray-200 shadow-[0_-1px_2px_rgba(0,0,0,0.04)]">
        <ul className="grid grid-cols-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] leading-tight ${active ? "text-blue-600 font-semibold" : "text-gray-600"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="truncate max-w-full px-1">{t(item.nameKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Main-Proxy</h3>
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
