import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { Admin, AdminRole, AdminStatus } from "../../types";

const roleLabels: Record<AdminRole, string> = {
  SUPER_ADMIN: "슈퍼 관리자",
  COUNSELOR: "상담사",
};

const statusLabels: Record<AdminStatus, { label: string; variant: "default" | "destructive" }> = {
  ACTIVE: { label: "활성", variant: "default" },
  INACTIVE: { label: "비활성", variant: "destructive" },
};

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AdminRole>("COUNSELOR");
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(() => {
    setLoading(true);
    api.get<Admin[]>("/v1/admin/admins")
      .then((res) => setAdmins(unwrap(res)))
      .catch(() => { toast.error("관리자 목록을 불러오지 못했습니다"); setAdmins([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const openCreate = () => {
    setEmail(""); setPassword(""); setName(""); setPhone(""); setRole("COUNSELOR");
    setFormOpen(true);
  };

  const handleCreate = async () => {
    if (!email || !password || !name) { toast.error("필수 항목을 입력해주세요"); return; }
    setSubmitting(true);
    try {
      await api.post<Admin>("/v1/admin/admins", { email, password, name, phone, role });
      toast.success("관리자 계정이 생성되었습니다");
      setFormOpen(false);
      loadList();
    } catch { toast.error("생성에 실패했습니다"); }
    finally { setSubmitting(false); }
  };

  const toggleStatus = async (id: number, currentStatus: AdminStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.patch<Admin>(`/v1/admin/admins/${id}/status`, { status: newStatus });
      toast.success("상태가 변경되었습니다");
      loadList();
    } catch { toast.error("상태 변경에 실패했습니다"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 관리</h1>
          <p className="text-gray-600 mt-1">관리자 계정을 생성하고 권한을 관리합니다</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />관리자 추가</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">불러오는 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>최근 로그인</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">관리자가 없습니다</TableCell></TableRow>
                ) : admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.email}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                        {roleLabels[a.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[a.status].variant}>
                        {statusLabels[a.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString("ko-KR") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(a.id, a.status)}>
                        {a.status === "ACTIVE" ? "비활성화" : "활성화"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>관리자 추가</DialogTitle>
            <DialogDescription>새 관리자 계정을 생성합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>이메일 *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ruxpress.com" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>비밀번호 *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="관리자 이름" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>역할 *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">슈퍼 관리자</SelectItem>
                  <SelectItem value="COUNSELOR">상담사</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>취소</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? "생성 중..." : "생성"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
