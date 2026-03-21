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

const statusLabels: Record<UserStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "정상", variant: "default" },
  SUSPENDED: { label: "정지", variant: "destructive" },
  WITHDRAWN: { label: "탈퇴", variant: "outline" },
};

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  withdrawnUsers: number;
  newUsersToday: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: "0", size: "100" });
    if (search.trim()) params.set("keyword", search.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    api
      .get<PageResponse<User>>(`/v1/admin/users?${params}`)
      .then((res) => setUsers(unwrap(res).content))
      .catch(() => {
        toast.error("회원 목록을 불러오지 못했습니다");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const loadStats = useCallback(() => {
    api
      .get<UserStats>("/v1/admin/users/stats")
      .then((res) => setStats(unwrap(res)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  const openDetail = async (id: number) => {
    try {
      const res = await api.get<User>(`/v1/admin/users/${id}`);
      setSelectedUser(unwrap(res));
      setDialogOpen(true);
    } catch {
      toast.error("회원 정보를 불러오지 못했습니다");
    }
  };

  const updateStatus = async (userId: number, status: UserStatus) => {
    try {
      const res = await api.patch<User>(`/v1/admin/users/${userId}/status`, { status });
      const updated = unwrap(res);
      setSelectedUser(updated);
      toast.success("회원 상태가 변경되었습니다");
      loadUsers();
      loadStats();
    } catch {
      toast.error("상태 변경에 실패했습니다");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-gray-600 mt-1">회원 목록 조회 및 상태를 관리합니다</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "전체 회원", value: stats.totalUsers },
            { label: "활성", value: stats.activeUsers },
            { label: "정지", value: stats.suspendedUsers },
            { label: "탈퇴", value: stats.withdrawnUsers },
            { label: "오늘 가입", value: stats.newUsersToday },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-sm text-gray-500">{s.label}</p>
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
                placeholder="이메일, 닉네임 검색"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="ACTIVE">정상</SelectItem>
                <SelectItem value="SUSPENDED">정지</SelectItem>
                <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">불러오는 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>가입 유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      회원이 없습니다
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
                        <Badge variant={statusLabels[user.status].variant}>
                          {statusLabels[user.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDetail(user.id)}>
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setSelectedUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>회원 상세</DialogTitle>
            <DialogDescription>회원 정보 및 상태를 관리합니다</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">ID:</span> #{selectedUser.id}</div>
                <div><span className="text-gray-500">이메일:</span> {selectedUser.email || "-"}</div>
                <div><span className="text-gray-500">닉네임:</span> {selectedUser.nickname}</div>
                <div><span className="text-gray-500">가입유형:</span> {selectedUser.signupType}</div>
                <div><span className="text-gray-500">상태:</span>{" "}
                  <Badge variant={statusLabels[selectedUser.status].variant}>
                    {statusLabels[selectedUser.status].label}
                  </Badge>
                </div>
                <div><span className="text-gray-500">가입일:</span>{" "}
                  {new Date(selectedUser.createdAt).toLocaleDateString("ko-KR")}
                </div>
                <div><span className="text-gray-500">최근 로그인:</span>{" "}
                  {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString("ko-KR") : "-"}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {selectedUser.status !== "ACTIVE" && (
                  <Button size="sm" onClick={() => updateStatus(selectedUser.id, "ACTIVE")}>정상 전환</Button>
                )}
                {selectedUser.status !== "SUSPENDED" && selectedUser.status !== "WITHDRAWN" && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedUser.id, "SUSPENDED")}>정지</Button>
                )}
                {selectedUser.status !== "WITHDRAWN" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(selectedUser.id, "WITHDRAWN")}>탈퇴 처리</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
