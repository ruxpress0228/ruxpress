import { createBrowserRouter, redirect } from "react-router";
import Root from "./components/Root";
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Signup from "./pages/user/Signup";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";
import PurchaseRequestForm from "./pages/user/PurchaseRequestForm";
import PurchaseRequestList from "./pages/user/PurchaseRequestList";
import PurchaseRequestDetail from "./pages/user/PurchaseRequestDetail.tsx";
import InquiryList from "./pages/user/InquiryList";
import InquiryForm from "./pages/user/InquiryForm";
import InquiryDetail from "./pages/user/InquiryDetail";
import NoticeList from "./pages/user/NoticeList";
import NoticeDetail from "./pages/user/NoticeDetail";
import MyPage from "./pages/user/MyPage";
import BankTransfer from "./pages/user/BankTransfer";
import WalletLedger from "./pages/user/WalletLedger";
import BankTransferReceipt from "./pages/user/BankTransferReceipt";
import Chat from "./pages/user/Chat";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPurchaseRequests from "./pages/admin/AdminPurchaseRequests";
import AdminPurchaseRequestDetail from "./pages/admin/AdminPurchaseRequestDetail";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminExchangeRate from "./pages/admin/AdminExchangeRate";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserWallets from "./pages/admin/AdminUserWallets";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminBankTransfers from "./pages/admin/AdminBankTransfers";
import AdminSettlementAccounts from "./pages/admin/AdminSettlementAccounts";
import AdminChat from "./pages/admin/AdminChat";
import AdminNotifications from "./pages/admin/AdminNotifications";
import NotFound from "./pages/NotFound";
import ExamplePage from "./pages/ExamplePage";
import { STORAGE_KEYS } from "./utils/constants";
import { readAuthValue } from "./utils/api";

function getTokenRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    const json = JSON.parse(decoded) as { role?: string };
    return json.role ?? null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "COUNSELOR";
}

/** localStorage(영속) 와 sessionStorage(세션) 어느 쪽에 있든 토큰을 찾아낸다. REQ2-01. */
function readToken(): string | null {
  return readAuthValue(STORAGE_KEYS.TOKEN);
}

function requireUserAuth() {
  const token = readToken();
  if (!token) {
    throw redirect("/login");
  }
  const role = getTokenRole(token);
  if (isAdminRole(role)) {
    throw redirect("/login");
  }
  return null;
}

function requireAdminAuth() {
  const token = readToken();
  if (!token) {
    throw redirect("/admin/login");
  }
  const role = getTokenRole(token);
  if (!isAdminRole(role)) {
    throw redirect("/admin/login");
  }
  return null;
}

/** 이미 로그인된 사용자가 인증 페이지(/login 등)에 들어오면 역할에 맞는 메인으로 보낸다. REQ2-01. */
function redirectIfAuthenticated() {
  const token = readToken();
  if (!token) return null;
  const role = getTokenRole(token);
  if (isAdminRole(role)) {
    throw redirect("/admin");
  }
  throw redirect("/");
}

/** /admin/login 가드: 이미 관리자 토큰을 가진 상태면 /admin 으로 보내되, 일반 회원 토큰이면 그대로 표시(역할 전환 허용). REQ2-01 Q1'''. */
function redirectIfAdminAuthenticated() {
  const token = readToken();
  if (!token) return null;
  const role = getTokenRole(token);
  if (isAdminRole(role)) {
    throw redirect("/admin");
  }
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "/",
        Component: UserLayout,
        children: [
          { index: true, Component: Home, loader: requireUserAuth},
          { path: "login", Component: Login, loader: redirectIfAuthenticated },
          { path: "signup", Component: Signup, loader: redirectIfAuthenticated },
          { path: "purchase/new", Component: PurchaseRequestForm, loader: requireUserAuth },
          { path: "purchase", Component: PurchaseRequestList, loader: requireUserAuth },
          { path: "purchase/:id", Component: PurchaseRequestDetail, loader: requireUserAuth },
          { path: "inquiry", Component: InquiryList, loader: requireUserAuth },
          { path: "inquiry/new", Component: InquiryForm, loader: requireUserAuth },
          { path: "inquiry/:id", Component: InquiryDetail, loader: requireUserAuth },
          { path: "notice", Component: NoticeList, loader: requireUserAuth },
          { path: "notice/:id", Component: NoticeDetail, loader: requireUserAuth },
          { path: "mypage", Component: MyPage, loader: requireUserAuth },
          { path: "forgot-password", Component: ForgotPassword, loader: redirectIfAuthenticated },
          { path: "reset-password", Component: ResetPassword, loader: redirectIfAuthenticated },
          { path: "bank-transfer", Component: BankTransfer, loader: requireUserAuth },
          { path: "wallet", Component: WalletLedger, loader: requireUserAuth },
          { path: "bank-transfer/receipt/:id", Component: BankTransferReceipt, loader: requireUserAuth },
          { path: "chat", Component: Chat, loader: requireUserAuth },
          { path: "example1", Component: ExamplePage },
        ],
      },
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { path: "login", Component: AdminLogin, loader: redirectIfAdminAuthenticated },
          { path: "", Component: AdminDashboard, loader: requireAdminAuth },
          { path: "purchase-requests", Component: AdminPurchaseRequests, loader: requireAdminAuth },
          { path: "purchase-requests/:id", Component: AdminPurchaseRequestDetail, loader: requireAdminAuth },
          { path: "inquiries", Component: AdminInquiries, loader: requireAdminAuth },
          { path: "notices", Component: AdminNotices, loader: requireAdminAuth },
          { path: "exchange-rate", Component: AdminExchangeRate, loader: requireAdminAuth },
          { path: "users", Component: AdminUsers, loader: requireAdminAuth },
          { path: "user-wallets", Component: AdminUserWallets, loader: requireAdminAuth },
          { path: "admins", Component: AdminAdmins, loader: requireAdminAuth },
          { path: "bank-transfers", Component: AdminBankTransfers, loader: requireAdminAuth },
          { path: "settlement-accounts", Component: AdminSettlementAccounts, loader: requireAdminAuth },
          { path: "chat", Component: AdminChat, loader: requireAdminAuth },
          { path: "notifications", Component: AdminNotifications, loader: requireAdminAuth },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
