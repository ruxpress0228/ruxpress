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
import { readAuthValue } from "../../utils/api";
import type { TransferLedgerEntry } from "../../types/bankTransfer";

const ADMIN_STORAGE_KEY = "ruxpress_admin";
const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

function getAdminRole(): string | null {
  try {
    const raw = readAuthValue(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).role as string;
  } catch {
    return null;
  }
}

function isRootDeposit(e: TransferLedgerEntry) {
  return (
    e.parentEntryId == null &&
    e.entryType === "DEPOSIT"
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
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const [actionOpen, setActionOpen] = useState(false);
  const [actionKind, setActionKind] = useState<"settle" | "refund" | null>(null);
  const [actionParentId, setActionParentId] = useState<number | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionMemo, setActionMemo] = useState("");

  const load = async (p = page, s = size) => {
    try {
      setLoading(true);
      const res = await adminListLedgerEntries({
        page: p,
        size: s,
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
              load(0, size);
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
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">{t("admin.bank.ledger.empty")}</p>
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
          <div className="flex items-center justify-between p-4 border-t flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>페이지당</span>
              <Select
                value={String(size)}
                onValueChange={(v) => { const s = Number(v); setSize(s); setPage(0); load(0, s); }}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}건</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => load(page - 1, size)}>이전</Button>
              <span className="text-sm text-gray-500">{page + 1} / {Math.max(1, totalPages)}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1, size)}>다음</Button>
            </div>
          </div>
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
