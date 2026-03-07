import { Outlet, Link, useLocation, Navigate } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { useTranslation } from "../../hooks/useTranslation";

export default function AdminLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const isActive = (path: string) => location.pathname === path;

  if (location.pathname === "/admin") {
    const isLoggedIn = true; // TODO: Replace with actual auth check
    if (!isLoggedIn && location.pathname === "/admin") {
      return <Navigate to="/admin/login" replace />;
    }
  }

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const navigation = [
    { nameKey: "nav.admin.dashboard", path: "/admin", icon: LayoutDashboard },
    { nameKey: "nav.admin.purchaseRequests", path: "/admin/purchase-requests", icon: ShoppingCart },
    { nameKey: "nav.admin.inquiries", path: "/admin/inquiries", icon: MessageSquare },
    { nameKey: "nav.admin.notices", path: "/admin/notices", icon: FileText },
    { nameKey: "nav.admin.exchangeRate", path: "/admin/exchange-rate", icon: TrendingUp },
    { nameKey: "nav.admin.users", path: "/admin/users", icon: Users },
  ];

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
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
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
                <p className="text-sm font-medium text-gray-900">{t("nav.admin.label")}</p>
                <p className="text-xs text-gray-500">admin@ruxpress.com</p>
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
