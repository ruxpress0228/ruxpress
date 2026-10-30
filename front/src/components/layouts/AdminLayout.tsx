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
  Shield,
  Landmark,
  Wallet,
  Coins,
  Bell,
  Globe,
  Check,
  Tag,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../ui/sidebar";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES, STORAGE_KEYS } from "../../utils/constants";
import { notifyUserAuthChange, readAuthValue } from "../../utils/api";
import AdminNotificationBell from "./AdminNotificationBell";
import { Mark, Wordmark } from "../brand/BrandMark";

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
    { nameKey: "nav.admin.products", path: "/admin/products", icon: Tag, roles: ["SUPER_ADMIN"] },
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
      <Sidebar>
        <SidebarHeader className="h-16 justify-center border-b border-border px-4 py-0">
          <div className="flex items-center gap-3">
            <Mark size="sm" />
            <div className="min-w-0">
              <Wordmark size="sm" />
              <p className="mt-0.5 text-xs text-muted-foreground">{t("nav.admin.label")}</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="px-2 py-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className="h-9 px-3 text-[13px] hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:font-medium"
                  >
                    <Link to={item.path} aria-current={active ? "page" : undefined}>
                      <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                      <span>{t(item.nameKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
            {t("nav.admin.logout")}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger className="size-9" title={t("nav.menu")} aria-label={t("nav.menu")} />

          <div className="ml-auto flex min-w-0 items-center gap-0.5">
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

            <AdminNotificationBell />

            <div className="ml-2 min-w-0 text-right">
              <p className="max-w-[10rem] truncate text-sm sm:max-w-[16rem]">{admin.name}</p>
              <p className="max-w-[10rem] truncate text-xs text-muted-foreground sm:max-w-[16rem]">
                {admin.email} ({roleLabel})
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-5 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
