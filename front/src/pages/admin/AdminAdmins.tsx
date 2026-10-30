import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
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
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Field, LoadingState, PageHeader } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { Admin, AdminRole, AdminStatus } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";

/** Active is a black fill, inactive is grey. */
const adminStatusVariants: Record<AdminStatus, "default" | "secondary"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
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
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.admin.title")}
        description={t("admin.admin.subtitle")}
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            {t("admin.admin.add")}
          </Button>
        }
      />

      {loading ? (
        <LoadingState label={t("admin.common.loading")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.common.col.email")}</TableHead>
              <TableHead>{t("admin.common.col.name")}</TableHead>
              <TableHead>{t("admin.common.col.role")}</TableHead>
              <TableHead>{t("admin.common.col.status")}</TableHead>
              <TableHead>{t("admin.common.col.lastLogin")}</TableHead>
              <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {t("admin.admin.empty")}
                </TableCell>
              </TableRow>
            ) : admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.email}</TableCell>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t(adminRoleKey(a.role))}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={adminStatusVariants[a.status]}>
                    {t(adminStatusKey(a.status))}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground figure">
                  {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString(dateLocale) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(a.id, a.status)}>
                    {a.status === "ACTIVE" ? t("admin.admin.deactivate") : t("admin.admin.activate")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.admin.createTitle")}</DialogTitle>
            <DialogDescription>{t("admin.admin.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <Field htmlFor="admin-email" label={t("admin.common.col.email")} required>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@main-proxy.com"
                disabled={submitting}
              />
            </Field>
            <Field htmlFor="admin-password" label={t("admin.login.password")} required>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("admin.admin.passwordHint")}
                disabled={submitting}
              />
            </Field>
            <Field htmlFor="admin-name" label={t("admin.common.col.name")} required>
              <Input
                id="admin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("admin.admin.namePlaceholder")}
                disabled={submitting}
              />
            </Field>
            <Field htmlFor="admin-phone" label={t("admin.admin.phone")}>
              <Input
                id="admin-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                disabled={submitting}
              />
            </Field>
            <Field htmlFor="admin-role" label={t("admin.common.col.role")} required>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger id="admin-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">{t("nav.admin.roleSuper")}</SelectItem>
                  <SelectItem value="COUNSELOR">{t("nav.admin.roleCounselor")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} disabled={submitting}>
              {t("admin.common.cancel")}
            </Button>
            <Button type="button" onClick={handleCreate} disabled={submitting}>
              {submitting ? t("admin.common.creating") : t("admin.common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
