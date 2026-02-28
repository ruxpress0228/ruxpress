import { Outlet, Link, useLocation } from "react-router";
import { Bell, Menu, User, ShoppingCart, MessageSquare, FileText, Home } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

export default function UserLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: "홈", path: "/", icon: Home },
    { name: "구매 요청", path: "/purchase", icon: ShoppingCart },
    { name: "1:1 문의", path: "/inquiry", icon: MessageSquare },
    { name: "공지사항", path: "/notice", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ruxpress</span>
            </Link>

            {/* Desktop Navigation */}
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
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
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

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>메뉴</SheetTitle>
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
                            {item.name}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Ruxpress</h3>
              <p className="text-sm text-gray-600">한러 구매대행 플랫폼</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">고객지원</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/inquiry" className="hover:text-blue-600">1:1 문의</Link></li>
                <li><Link to="/notice" className="hover:text-blue-600">공지사항</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">문의</h4>
              <p className="text-sm text-gray-600">이메일: support@ruxpress.com</p>
              <p className="text-sm text-gray-600">운영시간: 평일 09:00 - 18:00 (KST)</p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2026 Ruxpress. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
