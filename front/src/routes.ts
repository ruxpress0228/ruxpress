import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Signup from "./pages/user/Signup";
import PurchaseRequestForm from "./pages/user/PurchaseRequestForm";
import PurchaseRequestList from "./pages/user/PurchaseRequestList";
import InquiryList from "./pages/user/InquiryList";
import InquiryForm from "./pages/user/InquiryForm";
import InquiryDetail from "./pages/user/InquiryDetail";
import NoticeList from "./pages/user/NoticeList";
import NoticeDetail from "./pages/user/NoticeDetail";
import MyPage from "./pages/user/MyPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPurchaseRequests from "./pages/admin/AdminPurchaseRequests";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminExchangeRate from "./pages/admin/AdminExchangeRate";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import NotFound from "./pages/NotFound";
import ExamplePage from "./pages/ExamplePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "/",
        Component: UserLayout,
        children: [
          { index: true, Component: Home },
          { path: "login", Component: Login },
          { path: "signup", Component: Signup },
          { path: "purchase/new", Component: PurchaseRequestForm },
          { path: "purchase", Component: PurchaseRequestList },
          { path: "inquiry", Component: InquiryList },
          { path: "inquiry/new", Component: InquiryForm },
          { path: "inquiry/:id", Component: InquiryDetail },
          { path: "notice", Component: NoticeList },
          { path: "notice/:id", Component: NoticeDetail },
          { path: "mypage", Component: MyPage },
          { path: "example1", Component: ExamplePage },
        ],
      },
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { path: "login", Component: AdminLogin },
          { path: "", Component: AdminDashboard },
          { path: "purchase-requests", Component: AdminPurchaseRequests },
          { path: "inquiries", Component: AdminInquiries },
          { path: "notices", Component: AdminNotices },
          { path: "exchange-rate", Component: AdminExchangeRate },
          { path: "users", Component: AdminUsers },
          { path: "admins", Component: AdminAdmins },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
