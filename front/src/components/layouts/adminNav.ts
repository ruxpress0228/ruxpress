import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Coins,
  FileText,
  Image as ImageIcon,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Shield,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { readAuthValue } from "../../utils/api";

export const ADMIN_STORAGE_KEY = "ruxpress_admin";

export type AdminRole = "SUPER_ADMIN" | "COUNSELOR";

export interface AdminIdentity {
  id: number;
  email: string;
  name: string;
  role: AdminRole | string;
}

export function readAdmin(): AdminIdentity | null {
  try {
    const raw = readAuthValue(ADMIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminIdentity) : null;
  } catch {
    return null;
  }
}

export type AdminNavGroupKey = "ops" | "commerce" | "customers" | "content";

export interface AdminNavItem {
  nameKey: string;
  path: string;
  icon: LucideIcon;
  roles: AdminRole[];
}

export interface AdminNavGroup {
  key: AdminNavGroupKey;
  items: AdminNavItem[];
}

const EVERYONE: AdminRole[] = ["SUPER_ADMIN", "COUNSELOR"];
const SUPER: AdminRole[] = ["SUPER_ADMIN"];

/**
 * The console's navigation, grouped by what operators do during a day rather than
 * by database table: run the desk, move money and parcels, talk to customers, shape the store.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    key: "ops",
    items: [
      { nameKey: "nav.admin.dashboard", path: "/admin", icon: LayoutDashboard, roles: EVERYONE },
      { nameKey: "nav.admin.notifications", path: "/admin/notifications", icon: Bell, roles: EVERYONE },
    ],
  },
  {
    key: "commerce",
    items: [
      { nameKey: "nav.admin.purchaseRequests", path: "/admin/purchase-requests", icon: ShoppingCart, roles: SUPER },
      { nameKey: "nav.admin.bankTransfers", path: "/admin/bank-transfers", icon: Landmark, roles: EVERYONE },
      { nameKey: "nav.admin.userWallets", path: "/admin/user-wallets", icon: Coins, roles: SUPER },
      { nameKey: "nav.admin.settlementAccounts", path: "/admin/settlement-accounts", icon: Wallet, roles: SUPER },
    ],
  },
  {
    key: "customers",
    items: [
      { nameKey: "nav.admin.inquiries", path: "/admin/inquiries", icon: MessageSquare, roles: EVERYONE },
      { nameKey: "nav.admin.chat", path: "/admin/chat", icon: MessagesSquare, roles: EVERYONE },
      { nameKey: "nav.admin.users", path: "/admin/users", icon: Users, roles: SUPER },
    ],
  },
  {
    key: "content",
    items: [
      { nameKey: "nav.admin.products", path: "/admin/products", icon: Tag, roles: SUPER },
      { nameKey: "nav.admin.notices", path: "/admin/notices", icon: FileText, roles: SUPER },
      { nameKey: "nav.admin.exchangeRate", path: "/admin/exchange-rate", icon: TrendingUp, roles: SUPER },
      { nameKey: "nav.admin.site", path: "/admin/site", icon: ImageIcon, roles: SUPER },
      { nameKey: "nav.admin.admins", path: "/admin/admins", icon: Shield, roles: SUPER },
    ],
  },
];

export function navGroupsFor(role: string): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role as AdminRole)),
  })).filter((group) => group.items.length > 0);
}

export function canAccess(role: string, path: string): boolean {
  for (const group of ADMIN_NAV) {
    const item = group.items.find((i) => i.path === path);
    if (item) return item.roles.includes(role as AdminRole);
  }
  return false;
}

/** The nav item a pathname belongs to; detail pages resolve to their list ("/admin/users/3" → users). */
export function matchNav(pathname: string): { group: AdminNavGroup; item: AdminNavItem } | null {
  let best: { group: AdminNavGroup; item: AdminNavItem } | null = null;
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      const hit = item.path === "/admin" ? pathname === "/admin" : pathname === item.path || pathname.startsWith(item.path + "/");
      if (hit && (!best || item.path.length > best.item.path.length)) best = { group, item };
    }
  }
  return best;
}

/** Two letters for the identity chip: "관리자" → "관리", "Ivan Petrov" → "IP". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}
