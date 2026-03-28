import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { toast } from "sonner";
import {
  adminListSettlementAccounts,
  adminCreateSettlementAccount,
  adminUpdateSettlementAccount,
  adminDeleteSettlementAccount,
} from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import type { SettlementAccount } from "../../types/bankTransfer";

export default function AdminSettlementAccounts() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SettlementAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [displayMemo, setDisplayMemo] = useState("");
  const [active, setActive] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const list = await adminListSettlementAccounts();
      setRows(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.settlement.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setDisplayMemo("");
    setActive(true);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (a: SettlementAccount) => {
    setEditId(a.id);
    setBankName(a.bankName);
    setAccountNumber(a.accountNumber);
    setAccountHolder(a.accountHolder);
    setDisplayMemo(a.displayMemo ?? "");
    setActive(a.active);
    setOpen(true);
  };

  const onSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      toast.error(t("admin.bank.settlement.validation"));
      return;
    }
    try {
      if (editId == null) {
        await adminCreateSettlementAccount({
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          displayMemo: displayMemo.trim() || undefined,
        });
        toast.success(t("admin.bank.settlement.created"));
      } else {
        await adminUpdateSettlementAccount(editId, {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          displayMemo: displayMemo.trim() || undefined,
          active,
        });
        toast.success(t("admin.bank.settlement.updated"));
      }
      setOpen(false);
      resetForm();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.settlement.saveError"));
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm(t("admin.bank.settlement.deleteConfirm"))) return;
    try {
      await adminDeleteSettlementAccount(id);
      toast.success(t("admin.bank.settlement.deleted"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.settlement.deleteError"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.bank.settlement.title")}</h1>
          <p className="text-gray-600 text-sm">{t("admin.bank.settlement.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t("admin.bank.settlement.add")}
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editId == null ? t("admin.bank.settlement.add") : t("admin.bank.settlement.edit")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>{t("admin.bank.settlement.bankName")}</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.bank.settlement.accountNumber")}</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.bank.settlement.accountHolder")}</Label>
                <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.bank.settlement.memo")}</Label>
                <Input value={displayMemo} onChange={(e) => setDisplayMemo(e.target.value)} />
              </div>
              {editId != null ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  {t("admin.bank.settlement.active")}
                </label>
              ) : null}
              <Button className="w-full" onClick={onSave}>
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.bank.settlement.listTitle")}</CardTitle>
          <CardDescription>{t("admin.bank.settlement.listDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">{t("admin.bank.loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("admin.bank.settlement.bankName")}</TableHead>
                  <TableHead>{t("admin.bank.settlement.accountNumber")}</TableHead>
                  <TableHead>{t("admin.bank.settlement.accountHolder")}</TableHead>
                  <TableHead>{t("admin.bank.settlement.active")}</TableHead>
                  <TableHead className="text-right">{t("admin.bank.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      {t("admin.bank.settlement.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.id}</TableCell>
                      <TableCell>{a.bankName}</TableCell>
                      <TableCell className="font-mono">{a.accountNumber}</TableCell>
                      <TableCell>{a.accountHolder}</TableCell>
                      <TableCell>{a.active ? "Y" : "N"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(a.id)}>
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
