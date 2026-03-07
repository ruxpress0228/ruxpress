import { Outlet, Link, useLocation } from "react-router";
import { Bell, Menu, User, ShoppingCart, MessageSquare, FileText, Home, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES } from "../../utils/constants";

export default function UserLayout() {
  const location = useLocation();
  const { t, locale, setLocale } = useTranslation();
  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { nameKey: "nav.home", path: "/", icon: Home },
    { nameKey: "nav.purchase", path: "/purchase", icon: ShoppingCart },
    { nameKey: "nav.inquiry", path: "/inquiry", icon: MessageSquare },
    { nameKey: "nav.notice", path: "/notice", icon: FileText },
  ];

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title={t("common.language")}>
                    <Globe className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {LOCALES.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setLocale(loc)}
                      className={locale === loc ? "bg-accent" : undefined}
                    >
                      {t(`locale.${loc}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>
              <Link to="/mypage">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>

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
