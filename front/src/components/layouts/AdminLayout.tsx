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

export default function AdminLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Redirect to admin login if on admin root
  if (location.pathname === "/admin") {
    const isLoggedIn = true; // TODO: Replace with actual auth check
    if (!isLoggedIn && location.pathname === "/admin") {
      return <Navigate to="/admin/login" replace />;
    }
  }

  // Don't show sidebar on login page
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const navigation = [
    { name: "대시보드", path: "/admin", icon: LayoutDashboard },
    { name: "구매 요청 관리", path: "/admin/purchase-requests", icon: ShoppingCart },
    { name: "문의 관리", path: "/admin/inquiries", icon: MessageSquare },
    { name: "공지사항 관리", path: "/admin/notices", icon: FileText },
    { name: "환율 설정", path: "/admin/exchange-rate", icon: TrendingUp },
    { name: "회원 관리", path: "/admin/users", icon: Users },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Ruxpress</h2>
                <p className="text-xs text-gray-500">관리자</p>
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
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            <div className="mt-auto p-4 border-t border-gray-200">
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-40">
            <SidebarTrigger>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SidebarTrigger>
            <div className="ml-auto flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">관리자</p>
                <p className="text-xs text-gray-500">admin@ruxpress.com</p>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
