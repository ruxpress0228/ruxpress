import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, MapPin, ExternalLink, MoreHorizontal, Package, RefreshCw, ClipboardCopy, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../components/ui/utils";
import type { PurchaseRequestStatus } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
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

const STATUS_BADGE_VARIANT: Record<
  PurchaseRequestStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  REQUESTED: "secondary",
  PURCHASING: "default",
  SHIPPING: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

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

function statusAccent(status: PurchaseRequestStatus): { bar: string; softBg: string; badgeClass: string } {
  switch (status) {
    case "REQUESTED":
      return {
        bar: "border-l-slate-500",
        softBg: "bg-slate-50/90",
        badgeClass: "border-0 bg-slate-100 text-slate-900 ring-1 ring-slate-200/80",
      };
    case "PURCHASING":
      return {
        bar: "border-l-blue-600",
        softBg: "bg-blue-50/60",
        badgeClass: "border-0 bg-blue-100 text-blue-900 ring-1 ring-blue-200/90",
      };
    case "SHIPPING":
      return {
        bar: "border-l-violet-600",
        softBg: "bg-violet-50/60",
        badgeClass: "border-0 bg-violet-100 text-violet-900 ring-1 ring-violet-200/90",
      };
    case "COMPLETED":
      return {
        bar: "border-l-emerald-600",
        softBg: "bg-emerald-50/50",
        badgeClass: "border-0 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/90",
      };
    case "CANCELLED":
    default:
      return {
        bar: "border-l-rose-600",
        softBg: "bg-rose-50/50",
        badgeClass: "border-0 bg-rose-100 text-rose-900 ring-1 ring-rose-200/90",
      };
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

function shippingSummaryLines(s: PurchaseShipping): { title: string; subtitle: string } {
  const name = s.recipientName?.trim() || "수령인 미입력";
  const phone = s.recipientPhone?.trim();
  const line1 = [s.postalCode ? `(${s.postalCode})` : null, s.addressLine1].filter(Boolean).join(" ").trim();
  const line2 = s.addressLine2?.trim();
  const addrMain = [line1, line2].filter(Boolean).join(", ");
  const subtitle = [phone, addrMain].filter(Boolean).join(" · ") || "주소 없음";
  const label = s.label?.trim();
  const title = label ? `${label} · ${name}` : name;
  return { title, subtitle };
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
          className="h-8 w-8 text-gray-600"
          aria-label={t("adminPurchase.list.quickActions")}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem className="cursor-pointer" onSelect={onManage}>
          <Pencil className="mr-2 h-4 w-4 shrink-0" />
          {t("adminPurchase.list.actionManage")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to={`/admin/purchase-requests/${request.id}`}
            className="flex cursor-pointer items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="mr-2 h-4 w-4 shrink-0" />
            {t("adminPurchase.list.actionDetail")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onSelect={copyNumber}>
          <ClipboardCopy className="mr-2 h-4 w-4 shrink-0" />
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
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseRequestStatus>("all");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
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
      toast.success("저장되었습니다");
      setSelected(updated);
      void loadSummary();
      void fetchPage(page, size, statusFilter, userKeyword);
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const uploadAdminFiles = async () => {
    if (!selected || adminFiles.length === 0) return;
    try {
      setUploadingFiles(true);
      const updated = await adminUploadPurchaseAttachments(selected.id, adminFiles);
      toast.success(`사진 ${adminFiles.length}장이 업로드되었습니다`);
      setSelected(updated);
      setAdminFiles([]);
      void loadSummary();
      void fetchPage(page, size, statusFilter, userKeyword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "업로드 실패");
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
      toast.error(e instanceof Error ? e.message : "실패");
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
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{t("nav.admin.purchaseRequests")}</h1>
          <p className="mt-0.5 text-sm text-gray-600 md:text-base">{t("adminPurchase.list.subtitle")}</p>
          <p className="mt-1 text-xs text-gray-500">{fillTpl(t("adminPurchase.list.countLine"), { total: totalElements })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              void loadSummary();
              void fetchPage(page, size, statusFilter, userKeyword);
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("adminPurchase.list.refresh")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm md:p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-700 md:text-sm">{t("adminPurchase.list.summaryTitle")}</p>
          <Package className="h-4 w-4 text-gray-400" aria-hidden />
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
          {FILTER_CHIPS.map((chip) => {
            const key = chip.summaryKey ?? "ALL";
            const count = summaryCounts?.[key];
            const active = statusFilter === chip.value;
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
                  {chip.value === "all"
                    ? t("adminPurchase.list.filterAll")
                    : t(`purchase.status.${chip.value}` as `purchase.status.${PurchaseRequestStatus}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <Input
            placeholder={t("adminPurchase.list.searchClientPlaceholder")}
            className="h-9 border-gray-200 pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <Input
            placeholder={t("adminPurchase.list.userKeywordPlaceholder")}
            className="h-9 border-gray-200 text-sm"
            value={userKeyword}
            onChange={(e) => setUserKeyword(e.target.value)}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5">
          <Button
            type="button"
            variant={sort === "createdAt,desc" ? "default" : "ghost"}
            size="sm"
            className="h-8 flex-1 px-2 text-xs lg:flex-none lg:px-3"
            onClick={() => setSort("createdAt,desc")}
          >
            {t("adminPurchase.list.sortLatest")}
          </Button>
          <Button
            type="button"
            variant={sort === "createdAt,asc" ? "default" : "ghost"}
            size="sm"
            className="h-8 flex-1 px-2 text-xs lg:flex-none lg:px-3"
            onClick={() => setSort("createdAt,asc")}
          >
            {t("adminPurchase.list.sortOldest")}
          </Button>
        </div>
      </div>

      <div className="space-y-2 md:space-y-2.5">
        {loading ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
            {t("adminPurchase.list.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
            {t("adminPurchase.list.empty")}
          </div>
        ) : (
          filtered.map((request) => {
            const accent = statusAccent(request.status);
            const sh = request.shipping;
            const shipLines = hasShippingSnapshot(sh) && sh ? shippingSummaryLines(sh) : null;
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
              <article
                key={request.id}
                role="button"
                tabIndex={0}
                onClick={() => openManage(request)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openManage(request);
                  }
                }}
                className={cn(
                  "relative flex cursor-pointer rounded-lg border border-gray-100/90 border-l-4 bg-white py-2.5 pl-2 pr-2 shadow-sm outline-none transition-colors hover:border-gray-200 hover:bg-gray-50/40 md:py-3 md:pl-2.5 md:pr-3",
                  accent.bar,
                  accent.softBg,
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1 pr-10 md:gap-1.5 md:pr-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={cn("px-2 py-0 text-[11px] font-semibold md:text-xs", accent.badgeClass)}>
                      {t(`purchase.status.${request.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                    </Badge>
                    <span className="shrink-0 text-right text-base font-bold tabular-nums text-gray-900 md:hidden">
                      ₩{total.toLocaleString(dateLocale)}
                    </span>
                  </div>

                  <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 md:text-base">
                    {request.requestName}
                  </h2>

                  <p className="truncate text-xs text-gray-700 md:text-[13px]">
                    <span className="font-medium text-gray-800">{request.requestNumber}</span>
                    <span className="text-gray-300"> · </span>
                    <span title={request.userEmail ?? undefined}>
                      {request.userNickname ?? "—"}
                      {request.userEmail ? ` · ${request.userEmail}` : ` · #${request.userId}`}
                    </span>
                  </p>

                  <p
                    className={cn(
                      "text-xs leading-snug md:text-[13px]",
                      refundStyle ? "font-medium text-amber-800" : "text-gray-600",
                    )}
                  >
                    {t(progressKey)}
                  </p>

                  {shipLines ? (
                    <div className="flex min-w-0 gap-1.5 text-[11px] text-gray-600 md:text-xs" title={shipTitle}>
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
                      <span className="min-w-0 truncate">{shipLines.title}</span>
                      <span className="text-gray-300">·</span>
                      <span className="min-w-0 truncate">{shipLines.subtitle}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 md:text-xs">{t("adminPurchase.list.noShipping")}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 md:text-xs">
                    <time dateTime={request.createdAt}>{formatShortDate(request.createdAt, dateLocale)}</time>
                    <span className="text-gray-300" aria-hidden>
                      ·
                    </span>
                    <span>{fillTpl(t("adminPurchase.list.qtyTpl"), { n: request.quantity })}</span>
                    {charged != null ? (
                      <>
                        <span className="text-gray-300" aria-hidden>
                          ·
                        </span>
                        <span>
                          {t("adminPurchase.list.chargedShort")} ₩{charged.toLocaleString(dateLocale)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 border-gray-100/80 md:border-l md:pl-3">
                  <span className="hidden text-lg font-bold tabular-nums text-gray-900 md:inline">
                    ₩{total.toLocaleString(dateLocale)}
                  </span>
                  <div className="absolute right-1.5 top-1.5 md:relative md:right-auto md:top-auto">
                    <AdminRowQuickMenu
                      request={request}
                      t={t}
                      onManage={() => openManage(request)}
                      onCopied={() => toast.success(t("adminPurchase.list.copied"))}
                    />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {(totalPages > 1 || rows.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 md:text-sm">
            <span>{t("adminPurchase.list.perPage")}</span>
            <Select
              value={String(size)}
              onValueChange={(v) => {
                const s = Number(v);
                setSize(s);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-[76px] text-xs">
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
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 0} onClick={() => changePage(page - 1)}>
              {t("adminPurchase.list.prev")}
            </Button>
            <span className="text-xs text-gray-500 md:text-sm">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={totalPages <= 0 || page >= totalPages - 1}
              onClick={() => changePage(page + 1)}
            >
              {t("adminPurchase.list.next")}
            </Button>
          </div>
        </div>
      )}

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
              <div className="shrink-0 space-y-3 border-b bg-muted/20 px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pr-14">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <DialogTitle className="line-clamp-2 text-left text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                      {selected.requestName}
                    </DialogTitle>
                    <DialogDescription className="text-left text-xs text-gray-500 sm:text-sm">
                      {selected.requestNumber}
                    </DialogDescription>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[selected.status]} className="shrink-0">
                    {t(`purchase.status.${selected.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                  <p className="min-w-0 truncate">
                    <span className="text-gray-500">회원</span>{" "}
                    <span className="font-medium text-gray-900">{selected.userNickname ?? `#${selected.userId}`}</span>
                    {selected.userEmail ? (
                      <span className="hidden sm:inline"> · {selected.userEmail}</span>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 gap-1 text-xs text-gray-600 hover:text-gray-900"
                    onClick={() => navigate(`/admin/purchase-requests/${selected.id}`)}
                  >
                    전체 상세
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-4">
                  <Card className="border-gray-200 shadow-none">
                    <CardHeader className="space-y-1 pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-900">주문 요약</CardTitle>
                      <CardDescription className="text-xs">선차감·금액을 한눈에 확인합니다</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">수량</p>
                        <p className="mt-0.5 font-semibold text-gray-900">{selected.quantity}개</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">총 금액(원)</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {selected.totalAmountKrw != null
                            ? `₩${formatNumber(selected.totalAmountKrw, locale, num0)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">선차감</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {selected.chargedAmountKrw != null
                            ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">등록일</p>
                        <p className="mt-0.5 text-gray-800">
                          {new Date(selected.createdAt).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {hasShippingSnapshot(selected.shipping) && selected.shipping ? (
                    <Accordion type="single" collapsible className="rounded-lg border border-gray-200 bg-white px-3">
                      <AccordionItem value="shipping" className="border-0">
                        <AccordionTrigger className="py-3 text-sm hover:no-underline">
                          <span className="flex min-w-0 flex-1 items-start gap-2 text-left">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                            <span className="min-w-0">
                              <span className="block font-semibold text-gray-900">배송지</span>
                              <span className="mt-0.5 block truncate text-xs font-normal text-gray-600">
                                {shippingSummaryLines(selected.shipping).title} ·{" "}
                                {shippingSummaryLines(selected.shipping).subtitle}
                              </span>
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3 pt-0">
                          <div className="space-y-2 rounded-md border border-blue-100 bg-blue-50/50 p-3 text-sm text-gray-800">
                            {selected.shipping.label ? (
                              <p>
                                <span className="text-gray-500">라벨</span> {selected.shipping.label}
                              </p>
                            ) : null}
                            {(selected.shipping.recipientName || selected.shipping.recipientPhone) && (
                              <p>
                                <span className="text-gray-500">수령</span>{" "}
                                {[selected.shipping.recipientName, selected.shipping.recipientPhone]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                            <p className="break-words leading-relaxed">
                              <span className="text-gray-500">주소</span>{" "}
                              {selected.shipping.postalCode ? `(${selected.shipping.postalCode}) ` : null}
                              {selected.shipping.addressLine1}
                              {selected.shipping.addressLine2 ? ` ${selected.shipping.addressLine2}` : ""}
                            </p>
                            {selected.shipping.userAddressId != null && (
                              <p className="text-xs text-gray-500">회원 배송지 ID: {selected.shipping.userAddressId}</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-900">
                      배송지 스냅샷이 없습니다. 구버전 요청이거나 데이터 누락일 수 있습니다.
                    </p>
                  )}

                  <Card className="border-gray-900/10 shadow-sm ring-1 ring-gray-900/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-900">처리</CardTitle>
                      <CardDescription className="text-xs">상태·운송장·메모 변경 후 하단에서 저장합니다</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchase-admin-status">상태</Label>
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purchase-admin-tracking">운송장번호</Label>
                        <Input
                          id="purchase-admin-tracking"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="예: 1234-5678-9012"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purchase-admin-memo">관리자 메모</Label>
                        <Textarea
                          id="purchase-admin-memo"
                          rows={2}
                          value={statusMemo}
                          onChange={(e) => setStatusMemo(e.target.value)}
                          className="min-h-[72px] resize-y"
                          placeholder="내부 메모 (고객에게 노출되지 않음)"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Accordion type="multiple" className="space-y-2">
                    <AccordionItem
                      value="attachments"
                      className="rounded-lg border border-gray-200 bg-white px-3 data-[state=open]:shadow-sm"
                    >
                      <AccordionTrigger className="py-3 text-sm hover:no-underline">
                        <span className="font-semibold text-gray-900">관리자 사진 첨부</span>
                        <span className="ml-2 text-xs font-normal text-gray-500">배송/수령 등</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pb-1">
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) => setAdminFiles(Array.from(e.target.files || []))}
                          />
                          {adminFiles.length > 0 ? (
                            <p className="text-xs text-gray-500">{adminFiles.length}개 선택됨</p>
                          ) : null}
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            disabled={adminFiles.length === 0 || uploadingFiles}
                            onClick={() => void uploadAdminFiles()}
                          >
                            {uploadingFiles ? "업로드 중..." : `사진 업로드 (${adminFiles.length})`}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {isSuper ? (
                      <AccordionItem
                        value="wallet"
                        className="rounded-lg border border-amber-200/80 bg-amber-50/40 px-3 data-[state=open]:shadow-sm"
                      >
                        <AccordionTrigger className="py-3 text-sm hover:no-underline">
                          <span className="font-semibold text-amber-950">지갑 환급 · 차액 정산</span>
                          <span className="ml-2 text-xs font-normal text-amber-900/80">SUPER · 신중히 입력</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pb-1">
                            <p className="text-sm font-semibold text-amber-950">{t("adminPurchase.walletCreditTitle")}</p>
                            <div className="rounded-md border border-amber-200/90 bg-white px-3 py-2 text-sm">
                              <span className="text-gray-600">현재 선차감</span>{" "}
                              <span className="font-semibold text-gray-900">
                                {selected.chargedAmountKrw != null
                                  ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                                  : "—"}
                              </span>
                            </div>
                            <p className="text-xs text-amber-900/90">{t("adminPurchase.walletIdempotencyHint")}</p>
                            <div className="space-y-2">
                              <Label>{t("adminPurchase.walletAmount")}</Label>
                              <p className="text-xs text-gray-600">
                                모달을 열면 선차감 금액(없으면 총액)이 기본 입력됩니다. 전액 환급 시 그대로 제출하면 됩니다.
                              </p>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={walletAmount}
                                onChange={(e) => setWalletAmount(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("adminPurchase.walletSettled")}</Label>
                              <p className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                                {selected.chargedAmountKrw != null && walletAmount !== ""
                                  ? `₩${formatNumber(
                                      selected.chargedAmountKrw -
                                        parseFloat(walletAmount.replace(/,/g, "") || "0"),
                                      locale,
                                      num0
                                    )}`
                                  : "—"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Idempotency key</Label>
                              <Input value={walletIdem} onChange={(e) => setWalletIdem(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("adminPurchase.walletMemo")}</Label>
                              <Textarea rows={2} value={walletMemo} onChange={(e) => setWalletMemo(e.target.value)} />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              className="w-full"
                              onClick={() => void submitWallet()}
                            >
                              {t("adminPurchase.walletSubmit")}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                  </Accordion>

                  {!isSuper ? (
                    <p className="text-center text-xs text-amber-800">{t("admin.bank.superOnly")}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="hidden text-[11px] text-gray-500 sm:block">
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘</kbd> 또는{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd> +{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd> 로 상태 저장
                </p>
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    닫기
                  </Button>
                  <Button type="button" className="min-w-[8.5rem] font-semibold" onClick={() => void saveStatus()}>
                    상태·운송장 저장
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
