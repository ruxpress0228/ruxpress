import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  LogOut,
  Menu,
  Shield,
  Landmark,
  Wallet,
  Coins,
  Bell,
  Globe,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES, STORAGE_KEYS } from "../../utils/constants";
import { notifyUserAuthChange, readAuthValue } from "../../utils/api";
import AdminNotificationBell from "./AdminNotificationBell";

const ADMIN_STORAGE_KEY = "ruxpress_admin";

function getAdmin(): { id: number; email: string; name: string; role: string } | null {
  try {
    const raw = readAuthValue(ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const isActive = (path: string) => location.pathname === path;

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

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const token = readAuthValue(STORAGE_KEYS.TOKEN);
  const admin = getAdmin();

  if (!token || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    notifyUserAuthChange();
    navigate("/admin/login");
  };

  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  const roleLabel = isSuperAdmin ? t("nav.admin.roleSuper") : t("nav.admin.roleCounselor");

  const navigation = [
    { nameKey: "nav.admin.dashboard", path: "/admin", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.purchaseRequests", path: "/admin/purchase-requests", icon: ShoppingCart, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.inquiries", path: "/admin/inquiries", icon: MessageSquare, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.notices", path: "/admin/notices", icon: FileText, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.exchangeRate", path: "/admin/exchange-rate", icon: TrendingUp, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.users", path: "/admin/users", icon: Users, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.userWallets", path: "/admin/user-wallets", icon: Coins, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.admins", path: "/admin/admins", icon: Shield, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.bankTransfers", path: "/admin/bank-transfers", icon: Landmark, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.settlementAccounts", path: "/admin/settlement-accounts", icon: Wallet, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.chat", path: "/admin/chat", icon: MessageSquare, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.notifications", path: "/admin/notifications", icon: Bell, roles: ["SUPER_ADMIN", "COUNSELOR"] },
  ].filter((item) => item.roles.includes(admin.role));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tight">MP</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Main Proxy</h2>
                <p className="text-xs text-gray-500">{t("nav.admin.label")}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive(item.path)}>
                      <Link to={item.path}>
                        <Icon className="w-4 h-4" />
                        <span>{t(item.nameKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            <div className="mt-auto p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t("nav.admin.logout")}
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-40">
            <SidebarTrigger>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SidebarTrigger>
            <div className="ml-auto flex items-center space-x-4">
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
              <AdminNotificationBell />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-500">{admin.email} ({roleLabel})</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
