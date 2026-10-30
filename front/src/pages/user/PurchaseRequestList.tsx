import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { MoreHorizontal, Package, Plus, Search, Truck, MessageSquare, RotateCcw, Ban } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../components/ui/utils";
import { EmptyState, LoadingState, PageHeader, Pager, StatStrip, Toolbar } from "../../components/page";
import { purchaseStatusAccent } from "../../utils/purchaseStatusStyle";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { useBalance } from "../../hooks/balance/useBalance";
import { BalanceEquivalents } from "../../components/balance/BalanceEquivalents";
import { useI18n } from "../../i18n/I18nProvider";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";
import type { InquiryFormPrefillState } from "./InquiryForm";
import { toast } from "sonner";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

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
          className="size-8 text-muted-foreground hover:text-foreground"
          title={t("purchase.list.quickActions")}
          aria-label={t("purchase.list.quickActions")}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
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
              <Truck className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
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
          <MessageSquare className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {t("purchase.list.actionInquiry")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/purchase/new"
            className="flex cursor-pointer items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <RotateCcw className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
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
              <Ban className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
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
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
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

  const statusItems = FILTER_CHIPS.map((chip) => {
    const key = chip.summaryKey ?? "ALL";
    const count =
      chip.summaryKey === "PROGRESS"
        ? (summaryCounts?.REQUESTED ?? 0) + (summaryCounts?.PURCHASING ?? 0)
        : summaryCounts?.[key as keyof typeof summaryCounts];
    return {
      key: chip.value,
      label:
        chip.value === "all"
          ? t("purchase.list.filterAll")
          : chip.value === "progress"
            ? t("purchase.list.filterProgress")
            : t(`purchase.status.${chip.value}` as `purchase.status.${PurchaseRequestStatus}`),
      value: count ?? 0,
      onClick: () => setStatusFilter(chip.value),
      active: statusFilter === chip.value,
    };
  });

  const pageSizeSelect = (
    <>
      <span className="hidden sm:inline">{t("purchase.list.perPage")}</span>
      <Select
        value={String(size)}
        onValueChange={(v) => {
          const s = Number(v);
          setSize(s);
          setPage(0);
        }}
      >
        <SelectTrigger className="w-[6.5rem]" aria-label={t("purchase.list.perPage")}>
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
    </>
  );

  return (
    <div>
      <PageHeader
        title={t("purchase.list.pageTitle")}
        description={t("purchase.list.pageSubtitle")}
        actions={
          <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end md:gap-6">
            <Link
              to="/wallet"
              title={t("purchase.list.walletLinkTitle")}
              className="group min-w-0 md:max-w-xs md:text-right"
            >
              <span className="block text-xs text-muted-foreground">{t("purchase.list.balanceLabel")}</span>
              <span className="block truncate text-sm font-medium figure underline-offset-4 decoration-foreground/30 group-hover:underline">
                ₩{(balance ?? 0).toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <BalanceEquivalents balance={balance} className="truncate text-xs text-muted-foreground figure" />
            </Link>
            <Button asChild>
              <Link to="/purchase/new">
                <Plus strokeWidth={1.5} aria-hidden />
                {t("purchase.list.newRequest")}
              </Link>
            </Button>
          </div>
        }
      />

      <section aria-label={t("purchase.list.summaryTitle")}>
        <StatStrip size="sm" columns={7} items={statusItems} />
      </section>

      <div className="mt-8 md:mt-10">
        <Toolbar
          trailing={
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={sortValue === "latest" ? "default" : "ghost"}
                size="sm"
                aria-pressed={sortValue === "latest"}
                onClick={() => setSortValue("latest")}
              >
                {t("purchase.list.sortLatest")}
              </Button>
              <Button
                type="button"
                variant={sortValue === "oldest" ? "default" : "ghost"}
                size="sm"
                aria-pressed={sortValue === "oldest"}
                onClick={() => setSortValue("oldest")}
              >
                {t("purchase.list.sortOldest")}
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
              placeholder={t("purchase.list.searchPlaceholder")}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </Toolbar>

        {filteredRequests.length > 0 ? (
          <ul>
            {filteredRequests.map((request) => {
              const accent = purchaseStatusAccent(request.status);
              const refundDue = isRefundPending(request);
              const total = toAmountNumber(request.totalAmountKrw);
              const progressKey = refundDue
                ? "purchase.list.progress.refundPending"
                : `purchase.list.progress.${request.status}`;

              return (
                <li key={request.id}>
                  <article
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
                      "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-l-2 border-border py-4 pl-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 md:gap-5",
                      accent.bar,
                    )}
                  >
                    <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-medium", accent.badgeClass)}>
                      {t(`purchase.status.${request.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                    </Badge>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{request.requestName}</p>
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          refundDue ? "font-medium text-foreground" : "text-muted-foreground",
                        )}
                        title={t(progressKey)}
                      >
                        {t(progressKey)}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground figure">
                        <time dateTime={request.createdAt}>{formatShortDate(request.createdAt, dateLocale)}</time>
                        <span aria-hidden>·</span>
                        <span>{fillTpl(t("purchase.list.qtyInlineTpl"), { n: request.quantity })}</span>
                        <span className="hidden sm:inline" aria-hidden>
                          ·
                        </span>
                        <span className="hidden min-w-0 max-w-[220px] truncate sm:inline" title={request.requestNumber}>
                          {request.requestNumber}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 md:gap-3">
                      <span className="text-sm font-medium figure">₩{total.toLocaleString(dateLocale)}</span>
                      <QuickActionsMenu request={request} t={t} navigate={navigate} />
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : loading ? (
          <LoadingState className="mt-6" label={t("admin.common.loading")} />
        ) : null}

        {!loading && filteredRequests.length === 0 && (
          <EmptyState
            className="mt-6"
            icon={Package}
            title={t("purchase.list.emptyTitle")}
            description={t("purchase.list.emptySubtitle")}
            action={
              <Button variant="outline" asChild>
                <Link to="/purchase/new">
                  <Plus strokeWidth={1.5} aria-hidden />
                  {t("purchase.list.emptyCta")}
                </Link>
              </Button>
            }
          />
        )}

        {statusFilter !== "progress" && (totalPages > 1 || requests.length > 0) && (
          <Pager
            page={page}
            totalPages={totalPages}
            onPrev={() => void loadRequests(page - 1, size)}
            onNext={() => void loadRequests(page + 1, size)}
            prevLabel={t("purchase.list.prev")}
            nextLabel={t("purchase.list.next")}
            leading={pageSizeSelect}
          />
        )}
      </div>
    </div>
  );
}
