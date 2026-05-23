import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { MoreHorizontal, Package, Plus, Search, Truck, Wallet, MessageSquare, RotateCcw, Ban } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../components/ui/utils";
import { purchaseListSummaryChipActiveClasses, purchaseStatusAccent } from "../../utils/purchaseStatusStyle";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { useBalance } from "../../hooks/balance/useBalance";
import { useI18n } from "../../i18n/I18nProvider";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";
import type { InquiryFormPrefillState } from "./InquiryForm";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

const SUMMARY_STATUSES: PurchaseRequestStatus[] = [
  "REQUESTED",
  "PURCHASING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

type ListStatusFilter = "all" | "progress" | PurchaseRequestStatus;

function readListFilterFromSearchParams(sp: URLSearchParams): ListStatusFilter {
  if (sp.get("bucket") === "progress") return "progress";
  const st = sp.get("status");
  if (st && SUMMARY_STATUSES.includes(st as PurchaseRequestStatus)) {
    return st as PurchaseRequestStatus;
  }
  return "all";
}

const FILTER_CHIPS: { value: ListStatusFilter; summaryKey?: "ALL" | "PROGRESS" | PurchaseRequestStatus }[] = [
  { value: "all", summaryKey: "ALL" },
  { value: "progress", summaryKey: "PROGRESS" },
  { value: "REQUESTED", summaryKey: "REQUESTED" },
  { value: "PURCHASING", summaryKey: "PURCHASING" },
  { value: "SHIPPING", summaryKey: "SHIPPING" },
  { value: "COMPLETED", summaryKey: "COMPLETED" },
  { value: "CANCELLED", summaryKey: "CANCELLED" },
];

function toAmountNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isRefundPending(r: PurchaseRequestListItem): boolean {
  if (r.status !== "COMPLETED") return false;
  const charged = toAmountNumber(r.chargedAmountKrw ?? r.totalAmountKrw);
  const settledRaw = r.settledAmountKrw;
  if (settledRaw == null) return false;
  const settled = toAmountNumber(settledRaw);
  return charged > settled + 0.009;
}

function fillTpl(template: string, vars: Record<string, string | number>) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

function formatShortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { month: "numeric", day: "numeric" });
  } catch {
    return "";
  }
}

function QuickActionsMenu({
  request,
  t,
  navigate,
}: {
  request: PurchaseRequestListItem;
  t: (key: string) => string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const showShippingQuick = request.status === "SHIPPING" || request.status === "COMPLETED";
  const showCancelQuick = request.status === "REQUESTED";

  const inquiryState: InquiryFormPrefillState = {
    category: "ORDER",
    title: fillTpl(t("purchase.list.inquiryTitleTpl"), { number: request.requestNumber }),
    content: fillTpl(t("purchase.list.inquiryBodyTpl"), {
      number: request.requestNumber,
      name: request.requestName,
    }),
  };

  const cancelState: InquiryFormPrefillState = {
    category: "ORDER",
    title: fillTpl(t("purchase.list.cancelTitleTpl"), { number: request.requestNumber }),
    content: fillTpl(t("purchase.list.cancelBodyTpl"), {
      number: request.requestNumber,
      name: request.requestName,
    }),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600"
          aria-label={t("purchase.list.quickActions")}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link
            to={`/purchase/${request.id}`}
            className="flex cursor-pointer items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {t("purchase.list.actionDetail")}
          </Link>
        </DropdownMenuItem>
        {showShippingQuick ? (
          <DropdownMenuItem asChild>
            <Link
              to={`/purchase/${request.id}#purchase-shipping`}
              className="flex cursor-pointer items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Truck className="mr-2 h-4 w-4 shrink-0" />
              {t("purchase.list.actionTracking")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="flex cursor-pointer items-center"
          onSelect={() => {
            navigate("/inquiry/new", { state: inquiryState });
          }}
        >
          <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
          {t("purchase.list.actionInquiry")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/purchase/new"
            className="flex cursor-pointer items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <RotateCcw className="mr-2 h-4 w-4 shrink-0" />
            {t("purchase.list.actionReorder")}
          </Link>
        </DropdownMenuItem>
        {showCancelQuick ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex cursor-pointer items-center"
              onSelect={() => {
                navigate("/inquiry/new", { state: cancelState });
              }}
            >
              <Ban className="mr-2 h-4 w-4 shrink-0" />
              {t("purchase.list.actionCancel")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function PurchaseRequestList() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getMyPurchaseRequests } = usePurchase();
  const { balance } = useBalance();
  const [requests, setRequests] = useState<PurchaseRequestListItem[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<Partial<Record<"ALL" | PurchaseRequestStatus, number>> | null>(
    null,
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>(() =>
    typeof window !== "undefined" ? readListFilterFromSearchParams(new URLSearchParams(window.location.search)) : "all",
  );
  const urlFilterOnce = useRef(false);
  const [sortValue, setSortValue] = useState<"latest" | "oldest">("latest");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";

  useLayoutEffect(() => {
    if (urlFilterOnce.current) return;
    urlFilterOnce.current = true;
    const fromUrl = readListFilterFromSearchParams(searchParams);
    if (fromUrl !== "all") {
      setStatusFilter(fromUrl);
    }
  }, [searchParams]);

  const loadRequests = useCallback(
    async (p: number, s: number) => {
      try {
        setLoading(true);
        const sort = sortValue === "oldest" ? "createdAt,asc" : "createdAt,desc";
        if (statusFilter === "progress") {
          const cap = Math.min(Math.max(s, 20), 100);
          const [reqPage, purPage] = await Promise.all([
            getMyPurchaseRequests({ page: 0, size: cap, sort, status: "REQUESTED" }),
            getMyPurchaseRequests({ page: 0, size: cap, sort, status: "PURCHASING" }),
          ]);
          const merged = [...reqPage.content, ...purPage.content].sort((a, b) => {
            const ta = new Date(a.createdAt).getTime();
            const tb = new Date(b.createdAt).getTime();
            return sortValue === "oldest" ? ta - tb : tb - ta;
          });
          setRequests(merged.slice(0, s));
          setTotalPages(1);
          setPage(0);
          return;
        }
        const status = statusFilter === "all" ? undefined : statusFilter;
        const pageData = await getMyPurchaseRequests({ page: p, size: s, sort, status });
        setRequests(pageData.content);
        setTotalPages(pageData.totalPages ?? 0);
        setPage(pageData.page ?? p);
      } catch {
        toast.error(t("purchase.list.toastLoadError"));
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, sortValue, getMyPurchaseRequests, t],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [all, ...perStatus] = await Promise.all([
          getMyPurchaseRequests({ page: 0, size: 1 }),
          ...SUMMARY_STATUSES.map((s) => getMyPurchaseRequests({ page: 0, size: 1, status: s })),
        ]);
        if (cancelled) return;
        const next: Partial<Record<"ALL" | PurchaseRequestStatus, number>> = { ALL: all.totalElements };
        SUMMARY_STATUSES.forEach((s, i) => {
          next[s] = perStatus[i]?.totalElements ?? 0;
        });
        setSummaryCounts(next);
      } catch {
        if (!cancelled) setSummaryCounts({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getMyPurchaseRequests]);

  useEffect(() => {
    setPage(0);
    void loadRequests(0, size);
  }, [statusFilter, sortValue, size, loadRequests]);

  const filteredRequests = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return requests;
    return requests.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(keyword) || r.requestName.toLowerCase().includes(keyword),
    );
  }, [requests, searchKeyword]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{t("purchase.list.pageTitle")}</h1>
          <p className="mt-0.5 text-sm text-gray-600 md:mt-1 md:text-base">{t("purchase.list.pageSubtitle")}</p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-between gap-2 md:w-auto md:justify-end">
          <Link
            to="/wallet"
            className="flex min-w-0 max-w-[55%] items-center gap-2 rounded-lg bg-blue-50/90 px-2.5 py-1.5 ring-1 ring-blue-100 transition-colors hover:bg-blue-100/90 md:max-w-none md:px-3 md:py-2"
            title={t("purchase.list.walletLinkTitle")}
          >
            <Wallet className="h-4 w-4 shrink-0 text-blue-700 md:h-5 md:w-5" />
            <div className="min-w-0 text-right leading-tight">
              <p className="text-[10px] text-blue-700 md:text-xs">{t("purchase.list.balanceLabel")}</p>
              <p className="truncate text-sm font-bold text-blue-900 md:text-lg">
                ₩{(balance ?? 0).toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Link>
          <Link to="/purchase/new" className="shrink-0">
            <Button size="default" className="md:h-10 md:px-4 md:text-base">
              <Plus className="mr-1.5 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
              {t("purchase.list.newRequest")}
            </Button>
          </Link>
        </div>
      </div>

      {/* 요약 + 검색/정렬 */}
      <div className="mb-3 space-y-3 md:mb-4">
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm md:p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-700 md:text-sm">{t("purchase.list.summaryTitle")}</p>
            <Package className="h-4 w-4 text-gray-400" aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-7 sm:gap-2">
            {FILTER_CHIPS.map((chip) => {
              const key = chip.summaryKey ?? "ALL";
              const count =
                chip.summaryKey === "PROGRESS"
                  ? (summaryCounts?.REQUESTED ?? 0) + (summaryCounts?.PURCHASING ?? 0)
                  : summaryCounts?.[key as keyof typeof summaryCounts];
              const active = statusFilter === chip.value;
              const activeChip = purchaseListSummaryChipActiveClasses(chip.value);
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStatusFilter(chip.value)}
                  className={cn(
                    "flex min-h-[52px] flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center transition-all sm:min-h-[56px]",
                    active ? activeChip.shell : "border-transparent bg-gray-50/80 hover:bg-gray-100/90",
                  )}
                >
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums leading-none sm:text-xl",
                      active ? activeChip.countClass : "text-gray-900",
                    )}
                  >
                    {count ?? 0}
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[10px] font-medium text-gray-600 sm:text-xs">
                    {chip.value === "all"
                      ? t("purchase.list.filterAll")
                      : chip.value === "progress"
                        ? t("purchase.list.filterProgress")
                        : t(`purchase.status.${chip.value}` as `purchase.status.${PurchaseRequestStatus}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <Input
              placeholder={t("purchase.list.searchPlaceholder")}
              className="h-9 border-gray-200 pl-9 text-sm"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5">
            <Button
              type="button"
              variant={sortValue === "latest" ? "default" : "ghost"}
              size="sm"
              className="h-8 flex-1 px-2 text-xs sm:flex-none sm:px-3"
              onClick={() => setSortValue("latest")}
            >
              {t("purchase.list.sortLatest")}
            </Button>
            <Button
              type="button"
              variant={sortValue === "oldest" ? "default" : "ghost"}
              size="sm"
              className="h-8 flex-1 px-2 text-xs sm:flex-none sm:px-3"
              onClick={() => setSortValue("oldest")}
            >
              {t("purchase.list.sortOldest")}
            </Button>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-2 md:space-y-2.5">
        {filteredRequests.map((request) => {
          const accent = purchaseStatusAccent(request.status);
          const refundDue = isRefundPending(request);
          const total = toAmountNumber(request.totalAmountKrw);
          const progressKey = refundDue
            ? "purchase.list.progress.refundPending"
            : `purchase.list.progress.${request.status}`;

          return (
            <article
              key={request.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/purchase/${request.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/purchase/${request.id}`);
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

                <p
                  className={cn(
                    "text-xs leading-snug md:text-[13px]",
                    refundDue ? "font-medium text-amber-800" : "text-gray-600",
                  )}
                >
                  {t(progressKey)}
                </p>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 md:text-xs">
                  <time dateTime={request.createdAt}>{formatShortDate(request.createdAt, dateLocale)}</time>
                  <span className="text-gray-300" aria-hidden>
                    ·
                  </span>
                  <span>{fillTpl(t("purchase.list.qtyInlineTpl"), { n: request.quantity })}</span>
                  <span className="hidden text-gray-300 sm:inline" aria-hidden>
                    ·
                  </span>
                  <span className="hidden min-w-0 max-w-[220px] truncate sm:inline" title={request.requestNumber}>
                    {request.requestNumber}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1 border-gray-100/80 md:border-l md:pl-3">
                <span className="hidden text-lg font-bold tabular-nums text-gray-900 md:inline">
                  ₩{total.toLocaleString(dateLocale)}
                </span>
                <div className="absolute right-1.5 top-1.5 md:relative md:right-auto md:top-auto">
                  <QuickActionsMenu request={request} t={t} navigate={navigate} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && filteredRequests.length === 0 && (
        <Card className="mt-4 border-dashed py-10 md:py-12">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 md:mb-4 md:h-16 md:w-16">
              <Plus className="h-7 w-7 text-gray-400 md:h-8 md:w-8" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-gray-900 md:text-lg">{t("purchase.list.emptyTitle")}</h3>
            <p className="mb-5 text-sm text-gray-500">{t("purchase.list.emptySubtitle")}</p>
            <Link to="/purchase/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("purchase.list.emptyCta")}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {statusFilter !== "progress" && (totalPages > 1 || requests.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 md:text-sm">
            <span>{t("purchase.list.perPage")}</span>
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
                    {fillTpl(t("purchase.list.perPageOption"), { n: s })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => void loadRequests(page - 1, size)}>
              {t("purchase.list.prev")}
            </Button>
            <span className="text-xs text-gray-500 md:text-sm">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => void loadRequests(page + 1, size)}
            >
              {t("purchase.list.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
