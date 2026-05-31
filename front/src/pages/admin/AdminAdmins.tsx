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
import { useTranslation } from "../../hooks/useTranslation";

const adminStatusVariants: Record<AdminStatus, "default" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "destructive",
};

function adminRoleKey(role: AdminRole) {
  return role === "SUPER_ADMIN" ? "nav.admin.roleSuper" : "nav.admin.roleCounselor";
}

function adminStatusKey(status: AdminStatus) {
  return `admin.admin.status.${status}` as "admin.admin.status.ACTIVE" | "admin.admin.status.INACTIVE";
}

export default function AdminAdmins() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
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
      .catch(() => { toast.error(t("admin.admin.loadError")); setAdmins([]); })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { loadList(); }, [loadList]);

  const openCreate = () => {
    setEmail(""); setPassword(""); setName(""); setPhone(""); setRole("COUNSELOR");
    setFormOpen(true);
  };

  const handleCreate = async () => {
    if (!email || !password || !name) { toast.error(t("admin.common.requiredFields")); return; }
    setSubmitting(true);
    try {
      await api.post<Admin>("/v1/admin/admins", { email, password, name, phone, role });
      toast.success(t("admin.admin.created"));
      setFormOpen(false);
      loadList();
    } catch { toast.error(t("admin.common.createError")); }
    finally { setSubmitting(false); }
  };

  const toggleStatus = async (id: number, currentStatus: AdminStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.patch<Admin>(`/v1/admin/admins/${id}/status`, { status: newStatus });
      toast.success(t("admin.common.statusChanged"));
      loadList();
    } catch { toast.error(t("admin.common.statusChangeError")); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("admin.admin.title")}</h1>
          <p className="text-gray-600 mt-1">{t("admin.admin.subtitle")}</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />{t("admin.admin.add")}</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">{t("admin.common.loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.common.col.email")}</TableHead>
                  <TableHead>{t("admin.common.col.name")}</TableHead>
                  <TableHead>{t("admin.common.col.role")}</TableHead>
                  <TableHead>{t("admin.common.col.status")}</TableHead>
                  <TableHead>{t("admin.common.col.lastLogin")}</TableHead>
                  <TableHead>{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">{t("admin.admin.empty")}</TableCell></TableRow>
                ) : admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.email}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                        {t(adminRoleKey(a.role))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={adminStatusVariants[a.status]}>
                        {t(adminStatusKey(a.status))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString(dateLocale) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(a.id, a.status)}>
                        {a.status === "ACTIVE" ? t("admin.admin.deactivate") : t("admin.admin.activate")}
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
            <DialogTitle>{t("admin.admin.createTitle")}</DialogTitle>
            <DialogDescription>{t("admin.admin.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.common.col.email")} *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ruxpress.com" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.login.password")} *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("admin.admin.passwordHint")} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.common.col.name")} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.admin.namePlaceholder")} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.admin.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.common.col.role")} *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">{t("nav.admin.roleSuper")}</SelectItem>
                  <SelectItem value="COUNSELOR">{t("nav.admin.roleCounselor")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>{t("admin.common.cancel")}</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? t("admin.common.creating") : t("admin.common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
