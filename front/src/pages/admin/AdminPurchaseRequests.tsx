import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, MapPin, ExternalLink, MoreHorizontal, Package, RefreshCw, ClipboardCopy, Pencil } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../components/ui/utils";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import type { PurchaseRequestStatus } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { PurchaseRequestDetail, PurchaseShipping } from "../../types/purchase";
import {
  adminListPurchaseRequests,
  adminUpdatePurchaseStatus,
  adminCreditPurchaseWallet,
  adminUploadPurchaseAttachments,
} from "../../api/adminPurchase";
import { useTranslation } from "../../hooks/useTranslation";
import { formatNumber } from "../../utils/format";
import { readAuthValue } from "../../utils/api";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import {
  DescriptionList,
  EmptyState,
  Field,
  LoadingState,
  PageHeader,
  Pager,
  Section,
  StatStrip,
  Toolbar,
  type DescriptionItem,
} from "../../components/page";

const ADMIN_STORAGE_KEY = "ruxpress_admin";

function getAdminRole(): string | null {
  try {
    const raw = readAuthValue(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).role as string;
  } catch {
    return null;
  }
}

const FILTER_CHIPS: { value: "all" | PurchaseRequestStatus; summaryKey?: "ALL" | PurchaseRequestStatus }[] = [
  { value: "all", summaryKey: "ALL" },
  { value: "REQUESTED", summaryKey: "REQUESTED" },
  { value: "PURCHASING", summaryKey: "PURCHASING" },
  { value: "SHIPPING", summaryKey: "SHIPPING" },
  { value: "COMPLETED", summaryKey: "COMPLETED" },
  { value: "CANCELLED", summaryKey: "CANCELLED" },
];

function fillTpl(template: string, vars: Record<string, string | number>) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

function toAmountNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isRefundPending(r: PurchaseRequestDetail): boolean {
  if (r.status !== "COMPLETED") return false;
  const charged = toAmountNumber(r.chargedAmountKrw ?? r.totalAmountKrw);
  const settledRaw = r.settledAmountKrw;
  if (settledRaw == null) return false;
  const settled = toAmountNumber(settledRaw);
  return charged > settled + 0.009;
}

function formatShortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { month: "numeric", day: "numeric" });
  } catch {
    return "";
  }
}

function listProgressKey(r: PurchaseRequestDetail): string {
  if (isRefundPending(r)) return "adminPurchase.list.progress.refundPending";
  if (r.status === "SHIPPING" && !(r.trackingNumber && String(r.trackingNumber).trim())) {
    return "adminPurchase.list.progress.trackingMissing";
  }
  return `adminPurchase.list.progress.${r.status}`;
}

function hasShippingSnapshot(s?: PurchaseShipping | null): boolean {
  if (!s) return false;
  return Boolean(s.addressLine1 || s.recipientName);
}

function shippingSummaryLines(
  s: PurchaseShipping,
  tr: (key: string) => string,
): { title: string; subtitle: string } {
  const name = s.recipientName?.trim() || tr("adminPurchase.shipping.noRecipient");
  const phone = s.recipientPhone?.trim();
  const line1 = [s.postalCode ? `(${s.postalCode})` : null, s.addressLine1].filter(Boolean).join(" ").trim();
  const line2 = s.addressLine2?.trim();
  const addrMain = [line1, line2].filter(Boolean).join(", ");
  const subtitle = [phone, addrMain].filter(Boolean).join(" · ") || tr("adminPurchase.shipping.noAddress");
  const label = s.label?.trim();
  const title = label ? `${label} · ${name}` : name;
  return { title, subtitle };
}

/** Rows for the shipping snapshot panel in the manage dialog. */
function shippingDescriptionItems(s: PurchaseShipping, tr: (key: string) => string): DescriptionItem[] {
  const items: DescriptionItem[] = [];
  if (s.label) {
    items.push({ key: "label", label: tr("adminPurchase.modal.label"), value: s.label });
  }
  if (s.recipientName || s.recipientPhone) {
    items.push({
      key: "recipient",
      label: tr("adminPurchase.modal.recipient"),
      value: [s.recipientName, s.recipientPhone].filter(Boolean).join(" · "),
    });
  }
  items.push({
    key: "address",
    label: tr("adminPurchase.modal.address"),
    value: (
      <span className="leading-relaxed">
        {s.postalCode ? `(${s.postalCode}) ` : null}
        {s.addressLine1}
        {s.addressLine2 ? ` ${s.addressLine2}` : ""}
      </span>
    ),
  });
  return items;
}

const ALL_STATUSES: PurchaseRequestStatus[] = [
  "REQUESTED",
  "PURCHASING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

function AdminRowQuickMenu({
  request,
  t,
  onManage,
  onCopied,
}: {
  request: PurchaseRequestDetail;
  t: (key: string) => string;
  onManage: () => void;
  onCopied: () => void;
}) {
  const copyNumber = () => {
    void navigator.clipboard.writeText(request.requestNumber).then(() => onCopied());
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          title={t("adminPurchase.list.quickActions")}
          aria-label={t("adminPurchase.list.quickActions")}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className="cursor-pointer" onSelect={onManage}>
          <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
          {t("adminPurchase.list.actionManage")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to={`/admin/purchase-requests/${request.id}`}
            className="flex cursor-pointer items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
            {t("adminPurchase.list.actionDetail")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onSelect={copyNumber}>
          <ClipboardCopy className="size-4" strokeWidth={1.5} aria-hidden />
          {t("adminPurchase.list.actionCopyNumber")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminPurchaseRequests() {
  const { t, locale } = useTranslation();
  const isSuper = getAdminRole() === "SUPER_ADMIN";
  const [rows, setRows] = useState<PurchaseRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  // The dashboard queue links here with ?status=REQUESTED; anything else opens the full list.
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseRequestStatus>(() => {
    const s = searchParams.get("status");
    return s && ["REQUESTED", "PURCHASING", "SHIPPING", "COMPLETED", "CANCELLED"].includes(s) ? (s as PurchaseRequestStatus) : "all";
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState<"createdAt,desc" | "createdAt,asc">("createdAt,desc");
  const [userKeyword, setUserKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [summaryCounts, setSummaryCounts] = useState<
    Partial<Record<"ALL" | PurchaseRequestStatus, number>> | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequestDetail | null>(null);
  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>("PURCHASING");
  const [statusMemo, setStatusMemo] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminFiles, setAdminFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const navigate = useNavigate();

  const [walletAmount, setWalletAmount] = useState("");
  const [walletMemo, setWalletMemo] = useState("");
  const [walletIdem, setWalletIdem] = useState("");

  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";

  const fetchPage = useCallback(
    async (p: number, s: number, status: "all" | PurchaseRequestStatus, keyword: string) => {
      setLoading(true);
      try {
        const statusParam = status !== "all" ? status : undefined;
        const res = await adminListPurchaseRequests({
          page: p,
          size: s,
          status: statusParam,
          sort,
          userKeyword: keyword.trim() || undefined,
        });
        setRows(res.content ?? []);
        setTotalPages(res.totalPages ?? 0);
        setTotalElements(res.totalElements);
        setPage(res.page ?? p);
      } catch {
        toast.error(t("adminPurchase.loadError"));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [t, sort],
  );

  const loadSummary = useCallback(async () => {
    const kw = userKeyword.trim() || undefined;
    const base = { page: 0, size: 1, sort, userKeyword: kw };
    try {
      const [all, ...per] = await Promise.all([
        adminListPurchaseRequests(base),
        ...ALL_STATUSES.map((st) => adminListPurchaseRequests({ ...base, status: st })),
      ]);
      const next: Partial<Record<"ALL" | PurchaseRequestStatus, number>> = { ALL: all.totalElements };
      ALL_STATUSES.forEach((st, i) => {
        next[st] = per[i]?.totalElements ?? 0;
      });
      setSummaryCounts(next);
    } catch {
      setSummaryCounts({});
    }
  }, [sort, userKeyword]);

  useEffect(() => {
    void fetchPage(0, size, statusFilter, userKeyword);
  }, [statusFilter, sort, size, fetchPage, userKeyword]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (newStatus === "SHIPPING") {
      const id = window.setTimeout(() => {
        document.getElementById("purchase-admin-tracking")?.focus();
      }, 120);
      return () => window.clearTimeout(id);
    }
  }, [newStatus, dialogOpen]);

  const changePage = (next: number) => {
    void fetchPage(next, size, statusFilter, userKeyword);
  };

  const openManage = (r: PurchaseRequestDetail) => {
    setSelected(r);
    setNewStatus(r.status);
    setStatusMemo(r.adminMemo ?? "");
    setTrackingNumber(r.trackingNumber ?? "");
    setAdminFiles([]);
    const refundDefault =
      r.chargedAmountKrw != null
        ? Number(r.chargedAmountKrw)
        : r.totalAmountKrw != null
          ? Number(r.totalAmountKrw)
          : null;
    setWalletAmount(
      refundDefault != null && Number.isFinite(refundDefault)
        ? String(Math.round(refundDefault))
        : ""
    );
    setWalletMemo("");
    setWalletIdem(`purchase-${r.id}-${Date.now()}`);
    setDialogOpen(true);
  };

  const saveStatus = async () => {
    if (!selected) return;
    try {
      const updated = await adminUpdatePurchaseStatus(selected.id, {
        status: newStatus,
        adminMemo: statusMemo.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
      });
      toast.success(t("adminPurchase.toast.saved"));
      setSelected(updated);
      void loadSummary();
      void fetchPage(page, size, statusFilter, userKeyword);
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("adminPurchase.toast.failed"));
    }
  };

  const uploadAdminFiles = async () => {
    if (!selected || adminFiles.length === 0) return;
    try {
      setUploadingFiles(true);
      const updated = await adminUploadPurchaseAttachments(selected.id, adminFiles);
      toast.success(t("adminPurchase.toast.photosUploaded", { n: adminFiles.length }));
      setSelected(updated);
      setAdminFiles([]);
      void loadSummary();
      void fetchPage(page, size, statusFilter, userKeyword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("adminPurchase.toast.uploadFailed"));
    } finally {
      setUploadingFiles(false);
    }
  };

  const submitWallet = async () => {
    if (!selected || !isSuper) return;
    const amount = parseFloat(walletAmount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t("admin.bank.invalidAmount"));
      return;
    }
    const settled =
      selected.chargedAmountKrw != null ? selected.chargedAmountKrw - amount : undefined;
    try {
      await adminCreditPurchaseWallet(selected.id, {
        amount,
        idempotencyKey: walletIdem.trim() || `purchase-${selected.id}-${Date.now()}`,
        settledAmountKrw: settled != null && Number.isFinite(settled) ? settled : undefined,
        adminMemo: walletMemo.trim() || undefined,
      });
      toast.success(t("adminPurchase.walletSuccess"));
      setDialogOpen(false);
      void loadSummary();
      void fetchPage(page, size, statusFilter, userKeyword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("adminPurchase.toast.failed"));
    }
  };

  const num0 = { maximumFractionDigits: 0 };

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      const needle = search.trim();
      list = list.filter((r) => {
        if (r.requestNumber.includes(needle) || r.requestName.toLowerCase().includes(q)) return true;
        const sh = r.shipping;
        if (!sh) return false;
        const blob = [
          sh.label,
          sh.recipientName,
          sh.recipientPhone,
          sh.postalCode,
          sh.addressLine1,
          sh.addressLine2,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list;
  }, [rows, search]);

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("nav.admin.purchaseRequests")}
        description={t("adminPurchase.list.subtitle")}
        meta={<span className="figure">{fillTpl(t("adminPurchase.list.countLine"), { total: totalElements })}</span>}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void loadSummary();
              void fetchPage(page, size, statusFilter, userKeyword);
            }}
          >
            <RefreshCw className="size-4" strokeWidth={1.5} aria-hidden />
            {t("adminPurchase.list.refresh")}
          </Button>
        }
      />

      <Section title={t("adminPurchase.list.summaryTitle")} flush>
        <StatStrip
          size="sm"
          columns={6}
          className="border-t-0"
          items={FILTER_CHIPS.map((chip) => {
            const key = chip.summaryKey ?? "ALL";
            const count = summaryCounts?.[key];
            return {
              key: chip.value,
              label:
                chip.value === "all"
                  ? t("adminPurchase.list.filterAll")
                  : t(`purchase.status.${chip.value}` as `purchase.status.${PurchaseRequestStatus}`),
              value: count == null ? "–" : count,
              onClick: () => setStatusFilter(chip.value),
              active: statusFilter === chip.value,
            };
          })}
        />
      </Section>

      <div>
        <Toolbar
          trailing={
            <div className="flex items-center gap-0.5 border border-border p-0.5">
              <Button
                type="button"
                variant={sort === "createdAt,desc" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setSort("createdAt,desc")}
              >
                {t("adminPurchase.list.sortLatest")}
              </Button>
              <Button
                type="button"
                variant={sort === "createdAt,asc" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setSort("createdAt,asc")}
              >
                {t("adminPurchase.list.sortOldest")}
              </Button>
            </div>
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
              placeholder={t("adminPurchase.list.searchClientPlaceholder")}
              aria-label={t("adminPurchase.list.searchClientPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input
            className="min-w-0 flex-1 sm:max-w-xs"
            placeholder={t("adminPurchase.list.userKeywordPlaceholder")}
            aria-label={t("adminPurchase.list.userKeywordPlaceholder")}
            value={userKeyword}
            onChange={(e) => setUserKeyword(e.target.value)}
          />
        </Toolbar>

        {loading ? (
          <LoadingState label={t("adminPurchase.list.loading")} className="mt-4" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title={t("adminPurchase.list.empty")} className="mt-4" />
        ) : (
          <div className="mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.common.col.status")}</TableHead>
                  <TableHead>{t("admin.common.col.title")}</TableHead>
                  <TableHead>{t("adminPurchase.modal.shipping")}</TableHead>
                  <TableHead>{t("admin.common.col.createdAt")}</TableHead>
                  <TableHead className="text-right">{t("adminPurchase.list.chargedShort")}</TableHead>
                  <TableHead className="text-right">{t("adminPurchase.modal.totalKrw")}</TableHead>
                  <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((request) => {
                  const sh = request.shipping;
                  const shipLines = hasShippingSnapshot(sh) && sh ? shippingSummaryLines(sh, t) : null;
                  const shipTitle =
                    hasShippingSnapshot(sh) && sh
                      ? [sh.label, sh.recipientName, sh.recipientPhone, sh.postalCode, sh.addressLine1, sh.addressLine2]
                          .filter(Boolean)
                          .join("\n")
                      : undefined;
                  const total = toAmountNumber(request.totalAmountKrw);
                  const charged =
                    request.chargedAmountKrw != null ? toAmountNumber(request.chargedAmountKrw) : null;
                  const progressKey = listProgressKey(request);
                  const refundStyle = isRefundPending(request);

                  return (
                    <TableRow
                      key={request.id}
                      tabIndex={0}
                      onClick={() => openManage(request)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openManage(request);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell className="whitespace-normal">
                        <Badge
                          variant="outline"
                          className={cn("px-2 py-0.5 text-[10px] font-medium", purchaseStatusBadgeClass(request.status))}
                        >
                          {t(`purchase.status.${request.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                        </Badge>
                        <p
                          className={cn(
                            "mt-1.5 max-w-[12rem] text-[11px] leading-snug",
                            refundStyle ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {t(progressKey)}
                        </p>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm font-medium">{request.requestName}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          <span className="figure">{request.requestNumber}</span>
                          <span aria-hidden> · </span>
                          <span title={request.userEmail ?? undefined}>
                            {request.userNickname ?? "—"}
                            {request.userEmail ? ` · ${request.userEmail}` : ` · #${request.userId}`}
                          </span>
                        </p>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        {shipLines ? (
                          <div className="flex min-w-0 items-start gap-1.5 text-xs" title={shipTitle}>
                            <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                            <span className="min-w-0">
                              <span className="block truncate">{shipLines.title}</span>
                              <span className="block truncate text-muted-foreground">{shipLines.subtitle}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("adminPurchase.list.noShipping")}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground figure">
                        <time dateTime={request.createdAt}>{formatShortDate(request.createdAt, dateLocale)}</time>
                        <span aria-hidden> · </span>
                        <span>{fillTpl(t("adminPurchase.list.qtyTpl"), { n: request.quantity })}</span>
                      </TableCell>

                      <TableCell className="text-right text-sm figure">
                        {charged != null ? `₩${charged.toLocaleString(dateLocale)}` : "—"}
                      </TableCell>

                      <TableCell className="text-right text-sm font-medium figure">
                        ₩{total.toLocaleString(dateLocale)}
                      </TableCell>

                      <TableCell className="text-right">
                        <AdminRowQuickMenu
                          request={request}
                          t={t}
                          onManage={() => openManage(request)}
                          onCopied={() => toast.success(t("adminPurchase.list.copied"))}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {(totalPages > 1 || rows.length > 0) && (
          <Pager
            page={page}
            totalPages={totalPages}
            onPrev={() => changePage(page - 1)}
            onNext={() => changePage(page + 1)}
            prevLabel={t("adminPurchase.list.prev")}
            nextLabel={t("adminPurchase.list.next")}
            leading={
              <>
                <span>{t("adminPurchase.list.perPage")}</span>
                <Select
                  value={String(size)}
                  onValueChange={(v) => {
                    const s = Number(v);
                    setSize(s);
                    setPage(0);
                  }}
                >
                  <SelectTrigger size="sm" className="w-[6.5rem] text-xs" aria-label={t("adminPurchase.list.perPage")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {fillTpl(t("adminPurchase.list.perPageOption"), { n: s })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="flex h-[min(90vh,880px)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onKeyDown={(e) => {
            if (!selected) return;
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void saveStatus();
            }
          }}
        >
          {selected && (
            <>
              <div className="shrink-0 border-b border-border px-5 pb-4 pr-12 pt-5 sm:px-6 sm:pr-14">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="line-clamp-2 text-left leading-snug">
                      {selected.requestName}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-left text-xs figure">
                      {selected.requestNumber}
                    </DialogDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 px-2 py-0.5 text-[10px] font-medium", purchaseStatusBadgeClass(selected.status))}
                  >
                    {t(`purchase.status.${selected.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <p className="min-w-0 truncate">
                    <span>{t("adminPurchase.modal.member")}</span>{" "}
                    <span className="font-medium text-foreground">{selected.userNickname ?? `#${selected.userId}`}</span>
                    {selected.userEmail ? (
                      <span className="hidden sm:inline"> · {selected.userEmail}</span>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/admin/purchase-requests/${selected.id}`)}
                  >
                    {t("adminPurchase.modal.fullDetail")}
                    <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-8">
                  <Section
                    title={t("adminPurchase.modal.orderSummary")}
                    description={t("adminPurchase.modal.orderSummaryDesc")}
                  >
                    <DescriptionList
                      columns={2}
                      dense
                      items={[
                        {
                          key: "quantity",
                          label: t("adminPurchase.modal.quantity"),
                          value: <span className="figure">{t("adminPurchase.modal.quantityUnit", { n: selected.quantity })}</span>,
                        },
                        {
                          key: "total",
                          label: t("adminPurchase.modal.totalKrw"),
                          value: (
                            <span className="font-medium figure">
                              {selected.totalAmountKrw != null
                                ? `₩${formatNumber(selected.totalAmountKrw, locale, num0)}`
                                : "—"}
                            </span>
                          ),
                        },
                        {
                          key: "charged",
                          label: t("adminPurchase.modal.charged"),
                          value: (
                            <span className="font-medium figure">
                              {selected.chargedAmountKrw != null
                                ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                                : "—"}
                            </span>
                          ),
                        },
                        {
                          key: "createdAt",
                          label: t("adminPurchase.modal.createdAt"),
                          value: (
                            <span className="figure">
                              {new Date(selected.createdAt).toLocaleString(dateLocale, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </Section>

                  <Section title={t("adminPurchase.modal.shipping")}>
                    {hasShippingSnapshot(selected.shipping) && selected.shipping ? (
                      <div className="bg-muted/40 p-4 md:p-5">
                        <DescriptionList dense items={shippingDescriptionItems(selected.shipping, t)} />
                        {selected.shipping.userAddressId != null && (
                          <p className="mt-2 text-xs text-muted-foreground figure">
                            {t("adminPurchase.modal.userAddressId", { id: selected.shipping.userAddressId })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="border border-border p-4 text-sm text-muted-foreground">
                        {t("adminPurchase.modal.noShippingSnapshot")}
                      </p>
                    )}
                  </Section>

                  <Section title={t("adminPurchase.modal.process")} description={t("adminPurchase.modal.processDesc")}>
                    <div className="space-y-5">
                      <Field htmlFor="purchase-admin-status" label={t("adminPurchase.modal.status")}>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PurchaseRequestStatus)}>
                          <SelectTrigger id="purchase-admin-status" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {t(`purchase.status.${s}` as `purchase.status.${PurchaseRequestStatus}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field htmlFor="purchase-admin-tracking" label={t("adminPurchase.modal.tracking")}>
                        <Input
                          id="purchase-admin-tracking"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder={t("adminPurchase.modal.trackingPlaceholder")}
                          autoComplete="off"
                        />
                      </Field>
                      <Field htmlFor="purchase-admin-memo" label={t("adminPurchase.modal.adminMemo")}>
                        <Textarea
                          id="purchase-admin-memo"
                          rows={2}
                          value={statusMemo}
                          onChange={(e) => setStatusMemo(e.target.value)}
                          className="min-h-[72px] resize-y"
                          placeholder={t("adminPurchase.modal.adminMemoPlaceholder")}
                        />
                      </Field>
                    </div>
                  </Section>

                  <Accordion type="multiple" className="border-t border-border">
                    <AccordionItem value="attachments" className="border-b border-border last:border-b">
                      <AccordionTrigger className="py-4 text-sm hover:no-underline">
                        <span className="flex min-w-0 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
                          <span className="font-medium">{t("adminPurchase.modal.adminPhotos")}</span>
                          <span className="text-xs font-normal text-muted-foreground">{t("adminPurchase.modal.adminPhotosHint")}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            aria-label={t("adminPurchase.modal.adminPhotos")}
                            onChange={(e) => setAdminFiles(Array.from(e.target.files || []))}
                          />
                          {adminFiles.length > 0 ? (
                            <p className="text-xs text-muted-foreground figure">{t("adminPurchase.modal.filesSelected", { n: adminFiles.length })}</p>
                          ) : null}
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={adminFiles.length === 0 || uploadingFiles}
                              onClick={() => void uploadAdminFiles()}
                            >
                              {uploadingFiles ? t("adminPurchase.modal.uploading") : t("adminPurchase.modal.uploadPhotos", { n: adminFiles.length })}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {isSuper ? (
                      <AccordionItem value="wallet" className="border-b border-border last:border-b">
                        <AccordionTrigger className="py-4 text-sm hover:no-underline">
                          <span className="flex min-w-0 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
                            <span className="font-medium">{t("adminPurchase.modal.walletRefund")}</span>
                            <span className="text-xs font-normal text-muted-foreground">{t("adminPurchase.modal.walletRefundHint")}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-5">
                            <p className="text-sm font-medium">{t("adminPurchase.walletCreditTitle")}</p>
                            <DescriptionList
                              dense
                              items={[
                                {
                                  key: "currentCharged",
                                  label: t("adminPurchase.modal.currentCharged"),
                                  value: (
                                    <span className="font-medium figure">
                                      {selected.chargedAmountKrw != null
                                        ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                                        : "—"}
                                    </span>
                                  ),
                                },
                              ]}
                            />
                            <p className="hidden text-xs text-muted-foreground">{t("adminPurchase.walletIdempotencyHint")}</p>
                            <Field
                              htmlFor="purchase-admin-wallet-amount"
                              label={t("adminPurchase.walletAmount")}
                              hint={t("adminPurchase.modal.walletRefundNote")}
                            >
                              <Input
                                id="purchase-admin-wallet-amount"
                                type="number"
                                min="0"
                                step="1"
                                value={walletAmount}
                                onChange={(e) => setWalletAmount(e.target.value)}
                              />
                            </Field>
                            <Field label={t("adminPurchase.walletSettled")}>
                              <p className="border border-border px-3 py-2 text-sm font-medium figure">
                                {selected.chargedAmountKrw != null && walletAmount !== ""
                                  ? `₩${formatNumber(
                                      selected.chargedAmountKrw -
                                        parseFloat(walletAmount.replace(/,/g, "") || "0"),
                                      locale,
                                      num0
                                    )}`
                                  : "—"}
                              </p>
                            </Field>
                            <div className="hidden">
                              <Field htmlFor="purchase-admin-wallet-idem" label="Idempotency key">
                                <Input
                                  id="purchase-admin-wallet-idem"
                                  value={walletIdem}
                                  onChange={(e) => setWalletIdem(e.target.value)}
                                />
                              </Field>
                            </div>
                            <Field htmlFor="purchase-admin-wallet-memo" label={t("adminPurchase.walletMemo")}>
                              <Textarea
                                id="purchase-admin-wallet-memo"
                                rows={2}
                                value={walletMemo}
                                onChange={(e) => setWalletMemo(e.target.value)}
                              />
                            </Field>
                            <div className="flex justify-end">
                              <Button type="button" variant="destructive" onClick={() => void submitWallet()}>
                                {t("adminPurchase.walletSubmit")}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                  </Accordion>

                  {!isSuper ? (
                    <p className="text-xs text-muted-foreground">{t("admin.bank.superOnly")}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-background px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="hidden text-[11px] text-muted-foreground sm:block">
                  {t("adminPurchase.modal.saveShortcut")}
                </p>
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                    {t("adminPurchase.modal.close")}
                  </Button>
                  <Button type="button" onClick={() => void saveStatus()}>
                    {t("adminPurchase.modal.saveStatus")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
