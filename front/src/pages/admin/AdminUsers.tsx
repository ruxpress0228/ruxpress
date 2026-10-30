import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DescriptionList, LoadingState, PageHeader, Pager, StatStrip, Toolbar } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { User, UserStatus, PageResponse } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

const DESTRUCTIVE_OUTLINE = "border-destructive/30 bg-destructive/10 text-destructive";

/** Active is a black fill; suspended and withdrawn use the destructive outline. */
const userStatusBadge: Record<UserStatus, { variant: "default" | "outline"; className?: string }> = {
  ACTIVE: { variant: "default" },
  SUSPENDED: { variant: "outline", className: DESTRUCTIVE_OUTLINE },
  WITHDRAWN: { variant: "outline", className: DESTRUCTIVE_OUTLINE },
};

const USER_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "WITHDRAWN"];

function userStatusKey(status: UserStatus) {
  return `admin.user.status.${status}` as "admin.user.status.ACTIVE" | "admin.user.status.SUSPENDED" | "admin.user.status.WITHDRAWN";
}

/** The detail labels end with a colon in every locale; the description list separates columns itself. */
function stripColon(label: string) {
  return label.replace(/[:：]\s*$/, "");
}

function UserStatusBadge({ status, label }: { status: UserStatus; label: string }) {
  const { variant, className } = userStatusBadge[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  withdrawnUsers: number;
  newUsersToday: number;
}

export default function AdminUsers() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = useCallback((p: number, s: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(s) });
    if (search.trim()) params.set("keyword", search.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    api
      .get<PageResponse<User>>(`/v1/admin/users?${params}`)
      .then((res) => {
        const data = unwrap(res);
        setUsers(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        toast.error(t("admin.user.loadError"));
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, t]);

  const loadStats = useCallback(() => {
    api
      .get<UserStats>("/v1/admin/users/stats")
      .then((res) => setStats(unwrap(res)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  useEffect(() => {
    loadUsers(page, size);
    loadStats();
  }, [page, size, loadUsers, loadStats]);

  const openDetail = async (id: number) => {
    try {
      const res = await api.get<User>(`/v1/admin/users/${id}`);
      setSelectedUser(unwrap(res));
      setDialogOpen(true);
    } catch {
      toast.error(t("admin.user.detailLoadError"));
    }
  };

  const updateStatus = async (userId: number, status: UserStatus) => {
    try {
      const res = await api.patch<User>(`/v1/admin/users/${userId}/status`, { status });
      const updated = unwrap(res);
      setSelectedUser(updated);
      toast.success(t("admin.user.statusChanged"));
      loadUsers(page, size);
      loadStats();
    } catch {
      toast.error(t("admin.common.statusChangeError"));
    }
  };

  const statCards = stats ? [
    { key: "total", value: stats.totalUsers },
    { key: "active", value: stats.activeUsers },
    { key: "suspended", value: stats.suspendedUsers },
    { key: "withdrawn", value: stats.withdrawnUsers },
    { key: "today", value: stats.newUsersToday },
  ] : [];

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader title={t("admin.user.title")} description={t("admin.user.subtitle")} />

      {stats && (
        <StatStrip
          size="sm"
          columns={5}
          items={statCards.map((s) => ({
            key: s.key,
            label: t(`admin.user.stats.${s.key}`),
            value: s.value,
          }))}
        />
      )}

      <div className="space-y-4">
        <Toolbar
          trailing={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44" aria-label={t("admin.user.statusFilter")}>
                <SelectValue placeholder={t("admin.user.statusFilter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("admin.common.all")}</SelectItem>
                {USER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{t(userStatusKey(s))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder={t("admin.user.searchPlaceholder")}
              aria-label={t("admin.user.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Toolbar>

        {loading ? (
          <LoadingState label={t("admin.common.loading")} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.user.col.id")}</TableHead>
                  <TableHead>{t("admin.common.col.email")}</TableHead>
                  <TableHead>{t("admin.common.col.nickname")}</TableHead>
                  <TableHead>{t("admin.common.col.signupType")}</TableHead>
                  <TableHead>{t("admin.common.col.status")}</TableHead>
                  <TableHead>{t("admin.common.col.signupDate")}</TableHead>
                  <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {t("admin.user.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-muted-foreground figure">#{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="font-medium">{user.nickname}</TableCell>
                      <TableCell className="text-muted-foreground">{user.signupType}</TableCell>
                      <TableCell>
                        <UserStatusBadge status={user.status} label={t(userStatusKey(user.status))} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground figure">
                        {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(user.id)}>
                          {t("admin.common.detail")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pager
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
              prevLabel={t("admin.common.prev")}
              nextLabel={t("admin.common.next")}
              leading={
                <>
                  <span>{t("admin.common.pageSize")}</span>
                  <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
                    <SelectTrigger size="sm" className="w-[5.5rem] text-xs" aria-label={t("admin.common.pageSize")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{t("admin.common.pageSizeSuffix", { n: s })}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setSelectedUser(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.user.detailTitle")}</DialogTitle>
            <DialogDescription>{t("admin.user.detailDesc")}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <>
              <DescriptionList
                dense
                items={[
                  {
                    key: "id",
                    label: stripColon(t("admin.user.label.id")),
                    value: <span className="figure">#{selectedUser.id}</span>,
                  },
                  {
                    key: "email",
                    label: stripColon(t("admin.user.label.email")),
                    value: selectedUser.email || "-",
                  },
                  {
                    key: "nickname",
                    label: stripColon(t("admin.user.label.nickname")),
                    value: selectedUser.nickname,
                  },
                  {
                    key: "signupType",
                    label: stripColon(t("admin.user.label.signupType")),
                    value: selectedUser.signupType,
                  },
                  {
                    key: "status",
                    label: stripColon(t("admin.user.label.status")),
                    value: (
                      <UserStatusBadge status={selectedUser.status} label={t(userStatusKey(selectedUser.status))} />
                    ),
                  },
                  {
                    key: "signupDate",
                    label: stripColon(t("admin.user.label.signupDate")),
                    value: <span className="figure">{new Date(selectedUser.createdAt).toLocaleDateString(dateLocale)}</span>,
                  },
                  {
                    key: "lastLogin",
                    label: stripColon(t("admin.user.label.lastLogin")),
                    value: (
                      <span className="figure">
                        {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString(dateLocale) : "-"}
                      </span>
                    ),
                  },
                ]}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setDialogOpen(false); setSelectedUser(null); }}
                >
                  {t("admin.common.cancel")}
                </Button>
                {selectedUser.status !== "WITHDRAWN" && (
                  <Button type="button" variant="destructive" onClick={() => updateStatus(selectedUser.id, "WITHDRAWN")}>
                    {t("admin.user.withdraw")}
                  </Button>
                )}
                {selectedUser.status !== "SUSPENDED" && selectedUser.status !== "WITHDRAWN" && (
                  <Button type="button" variant="outline" onClick={() => updateStatus(selectedUser.id, "SUSPENDED")}>
                    {t("admin.user.suspend")}
                  </Button>
                )}
                {selectedUser.status !== "ACTIVE" && (
                  <Button type="button" onClick={() => updateStatus(selectedUser.id, "ACTIVE")}>
                    {t("admin.user.activate")}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
