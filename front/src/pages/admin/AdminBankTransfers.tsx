import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff, RefreshCw, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  DescriptionList,
  EmptyState,
  Field,
  LoadingState,
  PageHeader,
  Pager,
  StatStrip,
  Toolbar,
} from "../../components/page";
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
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import type { TransferLedgerEntry, TransferLedgerStatus } from "../../types/bankTransfer";

const ADMIN_STORAGE_KEY = "ruxpress_admin";

type StatusChipValue = "all" | TransferLedgerStatus;
const COUNTABLE_STATUSES: TransferLedgerStatus[] = ["PENDING", "CONFIRMED", "CANCELLED"];

const DESTRUCTIVE_OUTLINE = "border-destructive/30 bg-destructive/10 text-destructive";

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
  return e.parentEntryId == null && e.entryType === "DEPOSIT";
}

function remainingForAction(e: TransferLedgerEntry): number {
  if (!isRootDeposit(e) || e.status !== "CONFIRMED") return 0;
  if (e.remainingSettleOrRefundAmount != null) {
    return Math.max(0, e.remainingSettleOrRefundAmount);
  }
  return 0;
}

function isFullyProcessedRoot(e: TransferLedgerEntry): boolean {
  return isRootDeposit(e) && e.status === "CONFIRMED" && remainingForAction(e) <= 0;
}

/** Pending is an outline, confirmed a black fill, cancelled/failed the destructive outline. */
function LedgerStatusBadge({ status, label }: { status: TransferLedgerStatus; label: string }) {
  if (status === "CONFIRMED") return <Badge>{label}</Badge>;
  if (status === "CANCELLED" || status === "FAILED") {
    return (
      <Badge variant="outline" className={DESTRUCTIVE_OUTLINE}>
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline">{label}</Badge>;
}

export default function AdminBankTransfers() {
  const { t, locale } = useTranslation();
  const isSuper = getAdminRole() === "SUPER_ADMIN";
  const statusLabel = (status: TransferLedgerStatus) => t(`admin.bank.status.${status}`);
  const typeLabel = (type: string) => {
    const label = t(`admin.bank.type.${type}`);
    return label === `admin.bank.type.${type}` ? type : label;
  };
  const filterChips: { value: StatusChipValue; label: string }[] = [
    { value: "all", label: t("admin.bank.filterAll") },
    { value: "PENDING", label: statusLabel("PENDING") },
    { value: "CONFIRMED", label: statusLabel("CONFIRMED") },
    { value: "CANCELLED", label: statusLabel("CANCELLED") },
  ];
  const [rows, setRows] = useState<TransferLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [entryType, setEntryType] = useState<string>("DEPOSIT");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
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
        entryType: entryType || undefined,
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
          entryType: entryType || undefined,
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
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.bank.ledger.title")}
        description={t("admin.bank.ledger.subtitle")}
        meta={
          <>
            <span className="figure">
              {t("admin.bank.ledger.totalLine", { n: totalElements.toLocaleString(locale === "en" ? "en-US" : locale === "ru" ? "ru-RU" : "ko-KR") })}
            </span>
            {!isSuper ? <span>{t("admin.bank.counselorHint")}</span> : null}
          </>
        }
      />

      <section aria-label={t("admin.bank.ledger.summaryTitle")}>
        <StatStrip
          size="sm"
          columns={4}
          items={filterChips.map((chip) => {
            const key = chip.value === "all" ? "ALL" : chip.value;
            const count = summaryCounts?.[key];
            const active = (status === "" && chip.value === "all") || status === chip.value;
            return {
              key: chip.value,
              label: chip.label,
              value: count == null ? "–" : count,
              onClick: () => setStatusFilter(chip.value),
              active,
            };
          })}
        />
      </section>

      <div className="space-y-4">
        <Toolbar
          trailing={
            <Select
              value={entryType || "ALL"}
              onValueChange={(v) => {
                const next = v === "ALL" ? "" : v;
                setEntryType(next);
                setPage(0);
                void (async () => {
                  try {
                    setLoading(true);
                    const res = await adminListLedgerEntries({
                      page: 0,
                      size,
                      status: status || undefined,
                      entryType: next || undefined,
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
              }}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label={t("admin.bank.ledger.entryType")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEPOSIT">{t("admin.bank.ledger.entryTypeDeposit")}</SelectItem>
                <SelectItem value="SETTLEMENT">{t("admin.bank.ledger.entryTypeSettlement")}</SelectItem>
                <SelectItem value="REFUND">{t("admin.bank.ledger.entryTypeRefund")}</SelectItem>
                <SelectItem value="ALL">{t("admin.bank.all")}</SelectItem>
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
              type="text"
              autoComplete="off"
              placeholder={t("admin.bank.ledger.userEmailPlaceholder")}
              aria-label={t("admin.bank.ledger.userEmail")}
              value={userEmailFilter}
              onChange={(e) => setUserEmailFilter(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(0);
              load(0, size);
              void loadSummary();
            }}
          >
            <RefreshCw className="size-4" strokeWidth={1.5} aria-hidden />
            {t("admin.bank.apply")}
          </Button>
        </Toolbar>

        {loading ? (
          <LoadingState label={t("admin.bank.loading")} />
        ) : rows.length === 0 ? (
          <EmptyState title={t("admin.bank.ledger.empty")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{t("admin.bank.table.userEmail")}</TableHead>
                <TableHead>{t("admin.bank.ledger.entryType")}</TableHead>
                <TableHead className="text-right">{t("admin.bank.ledger.amount")}</TableHead>
                <TableHead>{t("admin.bank.ledger.status")}</TableHead>
                <TableHead>{t("admin.bank.ledger.detail.parentId")}</TableHead>
                <TableHead>{t("admin.bank.table.created")}</TableHead>
                <TableHead className="text-right">{t("admin.bank.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground figure">{r.id}</TableCell>
                  <TableCell className="max-w-[220px] truncate" title={r.userEmail ?? ""}>
                    {r.userEmail ?? "—"}
                  </TableCell>
                  <TableCell>{typeLabel(r.entryType)}</TableCell>
                  <TableCell className="text-right figure">
                    <span className="font-medium">
                      {r.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {r.currency}
                    </span>
                    {isRootDeposit(r) && r.status === "CONFIRMED" && r.remainingSettleOrRefundAmount != null ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("admin.bank.ledger.remaining")}:{" "}
                        {Math.max(0, r.remainingSettleOrRefundAmount).toLocaleString(
                          locale === "en" ? "en-US" : "ko-KR",
                        )}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <LedgerStatusBadge status={r.status} label={statusLabel(r.status)} />
                      {isFullyProcessedRoot(r) ? (
                        <Badge variant="secondary">{t("admin.bank.ledger.processed")}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground figure">{r.parentEntryId ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground figure">{formatDate(r.createdAt, locale)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => void openDetail(r.id)}>
                        {t("admin.common.detail")}
                      </Button>
                      {isRootDeposit(r) && r.status === "PENDING" && isSuper ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onCancel(r.id)}
                          >
                            {t("admin.bank.cancelReq")}
                          </Button>
                          <Button size="sm" onClick={() => onConfirm(r.id)}>
                            {t("admin.bank.confirm")}
                          </Button>
                        </>
                      ) : null}
                      {isRootDeposit(r) && r.status === "CONFIRMED" && isSuper && remainingForAction(r) > 0 ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openSettleRefund("refund", r.id, remainingForAction(r))}
                          >
                            {t("admin.bank.refund")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSettleRefund("settle", r.id, remainingForAction(r))}
                          >
                            {t("admin.bank.settle")}
                          </Button>
                        </>
                      ) : isFullyProcessedRoot(r) ? (
                        <span className="px-2 text-xs text-muted-foreground">{t("admin.bank.ledger.processed")}</span>
                      ) : !isRootDeposit(r) ? (
                        <span className="px-2 text-xs text-muted-foreground">{t("admin.bank.ledger.childRecord")}</span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Pager
          page={page}
          totalPages={totalPages}
          onPrev={() => load(page - 1, size)}
          onNext={() => load(page + 1, size)}
          prevLabel={t("admin.common.prev")}
          nextLabel={t("admin.common.next")}
          leading={
            <>
              <span>{t("admin.common.pageSize")}</span>
              <Select
                value={String(size)}
                onValueChange={(v) => { const s = Number(v); setSize(s); setPage(0); load(0, s); }}
              >
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
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.bank.ledger.detailTitle", { id: detail ? `#${detail.id}` : "" })}</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <LoadingState compact label={t("admin.common.loading")} />
          ) : (
            <div className="space-y-6">
              <DescriptionList
                dense
                columns={2}
                items={[
                  {
                    key: "user",
                    label: t("admin.bank.ledger.detail.user"),
                    value: <span className="font-medium">{detail.userEmail ?? `#${detail.userId}`}</span>,
                  },
                  {
                    key: "type",
                    label: t("admin.bank.ledger.detail.type"),
                    value: typeLabel(detail.entryType),
                  },
                  {
                    key: "amount",
                    label: t("admin.bank.ledger.detail.amount"),
                    value: (
                      <>
                        <span className="font-medium figure">
                          {detail.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {detail.currency}
                        </span>
                        {detail.remainingSettleOrRefundAmount != null ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground figure">
                            {t("admin.bank.ledger.remaining")}:{" "}
                            {Math.max(0, detail.remainingSettleOrRefundAmount).toLocaleString(
                              locale === "en" ? "en-US" : "ko-KR",
                            )}{" "}
                            {detail.currency}
                          </span>
                        ) : null}
                      </>
                    ),
                  },
                  {
                    key: "status",
                    label: t("admin.bank.ledger.detail.status"),
                    value: <LedgerStatusBadge status={detail.status} label={statusLabel(detail.status)} />,
                  },
                  {
                    key: "settlementAccount",
                    label: t("admin.bank.ledger.detail.settlementAccount"),
                    value: (
                      <span className="figure">
                        {detail.settlementAccount?.bankName} · {detail.settlementAccount?.accountNumber}
                      </span>
                    ),
                  },
                  {
                    key: "parentId",
                    label: t("admin.bank.ledger.detail.parentId"),
                    value: <span className="figure">{detail.parentEntryId ?? "—"}</span>,
                  },
                  {
                    key: "depositorName",
                    label: t("admin.bank.ledger.detail.depositorName"),
                    value: detail.depositorName ?? "—",
                  },
                  {
                    key: "depositMemo",
                    label: t("admin.bank.ledger.detail.depositMemo"),
                    value: detail.depositorMemo ?? "—",
                    span: true,
                  },
                  {
                    key: "adminMemo",
                    label: t("admin.bank.ledger.detail.adminMemo"),
                    value: detail.adminMemo ?? "—",
                    span: true,
                  },
                  {
                    key: "createdAt",
                    label: t("admin.bank.ledger.detail.createdAt"),
                    value: <span className="figure">{formatDate(detail.createdAt, locale)}</span>,
                  },
                  {
                    key: "confirmedAt",
                    label: t("admin.bank.ledger.detail.confirmedAt"),
                    value: <span className="figure">{detail.confirmedAt ? formatDate(detail.confirmedAt, locale) : "—"}</span>,
                  },
                  {
                    key: "confirmedAdminId",
                    label: t("admin.bank.ledger.detail.confirmedAdminId"),
                    value: <span className="figure">{detail.confirmedByAdminId ?? "—"}</span>,
                  },
                ]}
              />

              <div>
                <p className="text-sm font-medium">{t("admin.bank.ledger.detail.evidence")}</p>
                {!detail.attachments || detail.attachments.length === 0 ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageOff className="size-4" strokeWidth={1.5} aria-hidden />
                    {t("admin.bank.ledger.detail.noEvidence")}
                  </p>
                ) : (
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {detail.attachments.map((att) => {
                      const src = att.viewUrl || att.storedUrl;
                      return (
                        <li key={att.id}>
                          <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={att.originalFilename}
                            className="block border border-border transition-colors hover:bg-muted/60"
                          >
                            <img
                              src={att.thumbnailUrl || src}
                              alt={att.originalFilename}
                              className="h-32 w-full object-cover"
                              loading="lazy"
                            />
                            <p className="truncate border-t border-border px-2 py-1.5 text-xs text-muted-foreground">
                              {att.originalFilename}
                            </p>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionKind === "settle" ? t("admin.bank.settle") : t("admin.bank.refund")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <Field htmlFor="ledger-action-amount" label={t("admin.bank.ledger.amount")}>
              <Input
                id="ledger-action-amount"
                className="figure"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
              />
            </Field>
            <Field htmlFor="ledger-action-memo" label={t("admin.bank.memo")}>
              <Input id="ledger-action-memo" value={actionMemo} onChange={(e) => setActionMemo(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setActionOpen(false)}>
              {t("admin.common.cancel")}
            </Button>
            <Button type="button" onClick={submitSettleRefund}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
