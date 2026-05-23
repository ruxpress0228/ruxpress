import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Undo2, XCircle, RefreshCw, Eye, ImageOff, Landmark } from "lucide-react";
import { cn } from "../../components/ui/utils";
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
  adminGetLedgerEntry,
  adminConfirmLedgerEntry,
  adminSettleLedger,
  adminRefundLedger,
  adminCancelLedgerEntry,
} from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import { readAuthValue } from "../../utils/api";
import type { TransferLedgerEntry, TransferLedgerStatus } from "../../types/bankTransfer";

const ADMIN_STORAGE_KEY = "ruxpress_admin";
const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

type StatusChipValue = "all" | TransferLedgerStatus;
const FILTER_CHIPS: { value: StatusChipValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "PENDING", label: "PENDING" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "CANCELLED", label: "CANCELLED" },
];
const COUNTABLE_STATUSES: TransferLedgerStatus[] = ["PENDING", "CONFIRMED", "CANCELLED"];

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
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [summaryCounts, setSummaryCounts] = useState<
    Partial<Record<"ALL" | TransferLedgerStatus, number>> | null
  >(null);

  const [actionOpen, setActionOpen] = useState(false);
  const [actionKind, setActionKind] = useState<"settle" | "refund" | null>(null);
  const [actionParentId, setActionParentId] = useState<number | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionMemo, setActionMemo] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<TransferLedgerEntry | null>(null);

  const openDetail = async (id: number) => {
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await adminGetLedgerEntry(id);
      setDetail(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.loadError"));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const load = async (p = page, s = size) => {
    try {
      setLoading(true);
      const res = await adminListLedgerEntries({
        page: p,
        size: s,
        status: status || undefined,
        userEmail: userEmailFilter.trim() || undefined,
      });
      setRows(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
      setTotalElements(res.totalElements ?? 0);
      setPage(res.page ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = useCallback(async () => {
    const base = {
      page: 0,
      size: 1,
      userEmail: userEmailFilter.trim() || undefined,
    };
    try {
      const [all, ...per] = await Promise.all([
        adminListLedgerEntries(base),
        ...COUNTABLE_STATUSES.map((st) => adminListLedgerEntries({ ...base, status: st })),
      ]);
      const next: Partial<Record<"ALL" | TransferLedgerStatus, number>> = { ALL: all.totalElements };
      COUNTABLE_STATUSES.forEach((st, i) => {
        next[st] = per[i]?.totalElements ?? 0;
      });
      setSummaryCounts(next);
    } catch {
      setSummaryCounts({});
    }
  }, [userEmailFilter]);

  useEffect(() => {
    load(0);
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstEmailMount = useRef(true);
  useEffect(() => {
    if (firstEmailMount.current) {
      firstEmailMount.current = false;
      return;
    }
    const id = setTimeout(() => {
      setPage(0);
      void load(0, size);
      void loadSummary();
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmailFilter]);

  const setStatusFilter = (next: StatusChipValue) => {
    const value = next === "all" ? "" : next;
    setStatus(value);
    setPage(0);
    void (async () => {
      try {
        setLoading(true);
        const res = await adminListLedgerEntries({
          page: 0,
          size,
          status: value || undefined,
          userEmail: userEmailFilter.trim() || undefined,
        });
        setRows(res.content ?? []);
        setTotalPages(res.totalPages ?? 0);
        setTotalElements(res.totalElements ?? 0);
        setPage(res.page ?? 0);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("admin.bank.ledger.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  };

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
        <p className="mt-1 text-xs text-gray-500">전체 {totalElements.toLocaleString(locale === "en" ? "en-US" : "ko-KR")}건</p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm md:p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-700 md:text-sm">상태별 건수</p>
          <Landmark className="h-4 w-4 text-gray-400" aria-hidden />
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
          {FILTER_CHIPS.map((chip) => {
            const key = chip.value === "all" ? "ALL" : chip.value;
            const count = summaryCounts?.[key];
            const active = (status === "" && chip.value === "all") || status === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center transition-all sm:min-h-[56px]",
                  active
                    ? "border-blue-300 bg-blue-50/90 ring-2 ring-blue-400/35"
                    : "border-transparent bg-gray-50/80 hover:bg-gray-100/90",
                )}
              >
                <span
                  className={cn(
                    "text-lg font-bold tabular-nums leading-none sm:text-xl",
                    active ? "text-blue-900" : "text-gray-900",
                  )}
                >
                  {count == null ? "–" : count}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10px] font-medium text-gray-600 sm:text-xs">
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("admin.bank.ledger.filters")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>{t("admin.bank.ledger.userEmail")}</Label>
            <Input
              className="w-64"
              type="text"
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
              void loadSummary();
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
                  <TableHead className="text-center w-[80px]">상세</TableHead>
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
                    <TableCell className="text-center">
                      <Button size="sm" variant="ghost" onClick={() => void openDetail(r.id)}>
                        <Eye className="w-4 h-4 mr-1" />
                        상세
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-col items-stretch gap-1 min-w-[108px]">
                      {isRootDeposit(r) && r.status === "PENDING" && isSuper ? (
                        <>
                          <Button size="sm" variant="default" className="justify-start w-full" onClick={() => onConfirm(r.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t("admin.bank.confirm")}
                          </Button>
                          <Button size="sm" variant="outline" className="justify-start w-full" onClick={() => onCancel(r.id)}>
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
                            className="justify-start w-full"
                            onClick={() => openSettleRefund("settle", r.id, r.amount)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t("admin.bank.settle")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="justify-start w-full"
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>입금내역 상세 {detail ? `#${detail.id}` : ""}</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <p className="text-sm text-gray-500 py-4">불러오는 중…</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-gray-500">사용자</p>
                  <p className="font-medium">{detail.userEmail ?? `#${detail.userId}`}</p>
                </div>
                <div>
                  <p className="text-gray-500">유형</p>
                  <p className="font-medium">{detail.entryType}</p>
                </div>
                <div>
                  <p className="text-gray-500">금액</p>
                  <p className="font-medium">
                    {detail.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {detail.currency}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">상태</p>
                  <Badge variant={detail.status === "CONFIRMED" ? "default" : "secondary"}>{detail.status}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">정산계좌</p>
                  <p className="font-medium">
                    {detail.settlementAccount?.bankName} · {detail.settlementAccount?.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">부모 ID</p>
                  <p className="font-medium">{detail.parentEntryId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">입금자명</p>
                  <p className="font-medium">{detail.depositorName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">입금 메모</p>
                  <p className="font-medium break-words">{detail.depositorMemo ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">관리자 메모</p>
                  <p className="font-medium break-words">{detail.adminMemo ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">생성일</p>
                  <p className="font-medium">{formatDate(detail.createdAt, locale)}</p>
                </div>
                <div>
                  <p className="text-gray-500">확정일</p>
                  <p className="font-medium">{detail.confirmedAt ? formatDate(detail.confirmedAt, locale) : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">확정 관리자 ID</p>
                  <p className="font-medium">{detail.confirmedByAdminId ?? "—"}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="font-semibold mb-2">증빙 이미지</p>
                {!detail.attachments || detail.attachments.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500 py-3">
                    <ImageOff className="w-4 h-4" />
                    <span>첨부된 이미지가 없습니다</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detail.attachments.map((att) => {
                      const src = att.viewUrl || att.storedUrl;
                      return (
                        <a
                          key={att.id}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                          title={att.originalFilename}
                        >
                          <img
                            src={att.thumbnailUrl || src}
                            alt={att.originalFilename}
                            className="h-32 w-full object-cover rounded border group-hover:opacity-90"
                            loading="lazy"
                          />
                          <p className="text-xs text-gray-600 mt-1 truncate">{att.originalFilename}</p>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
