import { useEffect, useState } from "react";
import { CheckCircle, Undo2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  adminListLedgerEntries,
  adminConfirmLedgerEntry,
  adminSettleLedger,
  adminRefundLedger,
  adminCancelLedgerEntry,
} from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import type { TransferLedgerEntry } from "../../types/bankTransfer";

function getAdminRole(): string | null {
  try {
    const raw = localStorage.getItem("ruxpress_admin");
    if (!raw) return null;
    return JSON.parse(raw).role as string;
  } catch {
    return null;
  }
}

function isRootDeposit(e: TransferLedgerEntry) {
  return (
    e.parentEntryId == null &&
    (e.entryType === "DEPOSIT" || e.entryType === "ESCROW_HOLD")
  );
}

export default function AdminBankTransfers() {
  const { t, locale } = useTranslation();
  const isSuper = getAdminRole() === "SUPER_ADMIN";
  const [rows, setRows] = useState<TransferLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [entryType, setEntryType] = useState<string>("");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [actionOpen, setActionOpen] = useState(false);
  const [actionKind, setActionKind] = useState<"settle" | "refund" | null>(null);
  const [actionParentId, setActionParentId] = useState<number | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionMemo, setActionMemo] = useState("");

  const load = async (p = page) => {
    try {
      setLoading(true);
      const res = await adminListLedgerEntries({
        page: p,
        size: 30,
        status: status || undefined,
        entryType: entryType || undefined,
        userEmail: userEmailFilter.trim() || undefined,
      });
      setRows(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
      setPage(res.page ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
  }, []);

  const onConfirm = async (id: number) => {
    if (!isSuper) {
      toast.error(t("admin.bank.superOnly"));
      return;
    }
    try {
      await adminConfirmLedgerEntry(id);
      toast.success(t("admin.bank.ledger.confirmed"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.actionError"));
    }
  };

  const onCancel = async (id: number) => {
    if (!isSuper) {
      toast.error(t("admin.bank.superOnly"));
      return;
    }
    const memo = window.prompt(t("admin.bank.ledger.cancelMemo")) ?? "";
    try {
      await adminCancelLedgerEntry(id, memo || undefined);
      toast.success(t("admin.bank.ledger.cancelled"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.actionError"));
    }
  };

  const openSettleRefund = (kind: "settle" | "refund", parentId: number, maxAmount: number) => {
    setActionKind(kind);
    setActionParentId(parentId);
    setActionAmount(String(maxAmount));
    setActionMemo("");
    setActionOpen(true);
  };

  const submitSettleRefund = async () => {
    if (!isSuper || actionParentId == null || actionKind == null) return;
    const num = Number(actionAmount.replace(/,/g, ""));
    if (Number.isNaN(num) || num <= 0) {
      toast.error(t("admin.bank.invalidAmount"));
      return;
    }
    try {
      if (actionKind === "settle") {
        await adminSettleLedger(actionParentId, num, actionMemo.trim() || undefined);
      } else {
        await adminRefundLedger(actionParentId, num, actionMemo.trim() || undefined);
      }
      toast.success(t("admin.bank.ledger.done"));
      setActionOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.actionError"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.bank.ledger.title")}</h1>
        <p className="text-gray-600 text-sm">{t("admin.bank.ledger.subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("admin.bank.ledger.filters")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>{t("admin.bank.ledger.status")}</Label>
            <Select value={status || "ALL"} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("admin.bank.all")}</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t("admin.bank.ledger.entryType")}</Label>
            <Select value={entryType || "ALL"} onValueChange={(v) => setEntryType(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("admin.bank.all")}</SelectItem>
                <SelectItem value="DEPOSIT">DEPOSIT</SelectItem>
                <SelectItem value="ESCROW_HOLD">ESCROW_HOLD</SelectItem>
                <SelectItem value="SETTLEMENT">SETTLEMENT</SelectItem>
                <SelectItem value="REFUND">REFUND</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t("admin.bank.ledger.userEmail")}</Label>
            <Input
              className="w-64"
              type="email"
              autoComplete="off"
              placeholder={t("admin.bank.ledger.userEmailPlaceholder")}
              value={userEmailFilter}
              onChange={(e) => setUserEmailFilter(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setPage(0);
              load(0);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("admin.bank.apply")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.bank.ledger.listTitle")}</CardTitle>
          <CardDescription>
            {!isSuper ? t("admin.bank.counselorHint") : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">{t("admin.bank.loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("admin.bank.table.userEmail")}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>{t("admin.bank.table.created")}</TableHead>
                  <TableHead className="text-right">{t("admin.bank.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.id}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={r.userEmail ?? ""}>
                      {r.userEmail ?? "—"}
                    </TableCell>
                    <TableCell>{r.entryType}</TableCell>
                    <TableCell>
                      {r.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {r.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "CONFIRMED" ? "default" : "secondary"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>{r.parentEntryId ?? "—"}</TableCell>
                    <TableCell>{formatDate(r.createdAt, locale)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                      {isRootDeposit(r) && r.status === "PENDING" && isSuper ? (
                        <>
                          <Button size="sm" variant="default" onClick={() => onConfirm(r.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t("admin.bank.confirm")}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onCancel(r.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            {t("admin.bank.cancelReq")}
                          </Button>
                        </>
                      ) : null}
                      {isRootDeposit(r) && r.status === "CONFIRMED" && isSuper ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openSettleRefund("settle", r.id, r.amount)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t("admin.bank.settle")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSettleRefund("refund", r.id, r.amount)}
                          >
                            <Undo2 className="w-4 h-4 mr-1" />
                            {t("admin.bank.refund")}
                          </Button>
                        </>
                      ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 ? (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => load(page - 1)}
              >
                Prev
              </Button>
              <span className="text-sm self-center">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => load(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionKind === "settle" ? t("admin.bank.settle") : t("admin.bank.refund")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("admin.bank.ledger.amount")}</Label>
              <Input value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} />
            </div>
            <div>
              <Label>{t("admin.bank.memo")}</Label>
              <Input value={actionMemo} onChange={(e) => setActionMemo(e.target.value)} />
            </div>
            <Button className="w-full" onClick={submitSettleRefund}>
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
