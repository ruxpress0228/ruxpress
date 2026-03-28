import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router";
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
} from "lucide-react";
import { Button } from "../ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { useTranslation } from "../../hooks/useTranslation";
import { STORAGE_KEYS } from "../../utils/constants";

function getAdmin(): { id: number; email: string; name: string; role: string } | null {
  try {
    const raw = localStorage.getItem("ruxpress_admin");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isActive = (path: string) => location.pathname === path;

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const admin = getAdmin();

  if (!token || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem("ruxpress_admin");
    navigate("/admin/login");
  };

  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  const navigation = [
    { nameKey: "nav.admin.dashboard", path: "/admin", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.purchaseRequests", path: "/admin/purchase-requests", icon: ShoppingCart, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.inquiries", path: "/admin/inquiries", icon: MessageSquare, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.notices", path: "/admin/notices", icon: FileText, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.exchangeRate", path: "/admin/exchange-rate", icon: TrendingUp, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.users", path: "/admin/users", icon: Users, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.admins", path: "/admin/admins", icon: Shield, roles: ["SUPER_ADMIN"] },
    { nameKey: "nav.admin.bankTransfers", path: "/admin/bank-transfers", icon: Landmark, roles: ["SUPER_ADMIN", "COUNSELOR"] },
    { nameKey: "nav.admin.settlementAccounts", path: "/admin/settlement-accounts", icon: Wallet, roles: ["SUPER_ADMIN"] },
  ].filter((item) => item.roles.includes(admin.role));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Ruxpress</h2>
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
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-500">{admin.email}{isSuperAdmin ? " (슈퍼 관리자)" : " (상담사)"}</p>
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
