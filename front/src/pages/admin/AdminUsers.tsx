import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { User, UserStatus, PageResponse } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

const userStatusVariants: Record<UserStatus, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  SUSPENDED: "destructive",
  WITHDRAWN: "outline",
};

const USER_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "WITHDRAWN"];

function userStatusKey(status: UserStatus) {
  return `admin.user.status.${status}` as "admin.user.status.ACTIVE" | "admin.user.status.SUSPENDED" | "admin.user.status.WITHDRAWN";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.user.title")}</h1>
        <p className="text-gray-600 mt-1">{t("admin.user.subtitle")}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card key={s.key}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-sm text-gray-500">{t(`admin.user.stats.${s.key}` as "admin.user.stats.total")}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t("admin.user.searchPlaceholder")}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("admin.user.statusFilter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("admin.common.all")}</SelectItem>
                {USER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{t(userStatusKey(s))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">{t("admin.common.loading")}</div>
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
                  <TableHead>{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {t("admin.user.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-sm text-gray-500">#{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="font-medium">{user.nickname}</TableCell>
                      <TableCell className="text-sm text-gray-500">{user.signupType}</TableCell>
                      <TableCell>
                        <Badge variant={userStatusVariants[user.status]}>
                          {t(userStatusKey(user.status))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDetail(user.id)}>
                          {t("admin.common.detail")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{t("admin.common.pageSize")}</span>
                <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
                  <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>{t("admin.common.pageSizeSuffix", { n: s })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>{t("admin.common.prev")}</Button>
                <span className="text-sm text-gray-500">{t("admin.common.pageOf", { page: page + 1, total: Math.max(1, totalPages) })}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>{t("admin.common.next")}</Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setSelectedUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.user.detailTitle")}</DialogTitle>
            <DialogDescription>{t("admin.user.detailDesc")}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">{t("admin.user.label.id")}</span> #{selectedUser.id}</div>
                <div><span className="text-gray-500">{t("admin.user.label.email")}</span> {selectedUser.email || "-"}</div>
                <div><span className="text-gray-500">{t("admin.user.label.nickname")}</span> {selectedUser.nickname}</div>
                <div><span className="text-gray-500">{t("admin.user.label.signupType")}</span> {selectedUser.signupType}</div>
                <div><span className="text-gray-500">{t("admin.user.label.status")}</span>{" "}
                  <Badge variant={userStatusVariants[selectedUser.status]}>
                    {t(userStatusKey(selectedUser.status))}
                  </Badge>
                </div>
                <div><span className="text-gray-500">{t("admin.user.label.signupDate")}</span>{" "}
                  {new Date(selectedUser.createdAt).toLocaleDateString(dateLocale)}
                </div>
                <div><span className="text-gray-500">{t("admin.user.label.lastLogin")}</span>{" "}
                  {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString(dateLocale) : "-"}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {selectedUser.status !== "ACTIVE" && (
                  <Button size="sm" onClick={() => updateStatus(selectedUser.id, "ACTIVE")}>{t("admin.user.activate")}</Button>
                )}
                {selectedUser.status !== "SUSPENDED" && selectedUser.status !== "WITHDRAWN" && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedUser.id, "SUSPENDED")}>{t("admin.user.suspend")}</Button>
                )}
                {selectedUser.status !== "WITHDRAWN" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(selectedUser.id, "WITHDRAWN")}>{t("admin.user.withdraw")}</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
