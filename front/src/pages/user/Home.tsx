import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { ShoppingCart, TrendingUp, ArrowRight, Package, Truck, CheckCircle2, Ban } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn } from "../../components/ui/utils";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import { api, readAuthValue } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { formatDate } from "../../utils/format";
import { STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import type { Notice, PageResponse } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";
import type { PurchaseRequestStatus } from "../../types";
import {
  type QuoteCurrency,
  type CurrentExchangeRates,
  QUOTE_CURRENCIES,
  buildRateMap,
  formatCrossRateLine,
  normalizeBaseAmount,
  otherCurrencies,
} from "../../utils/exchange";

const SUMMARY_STATUSES: PurchaseRequestStatus[] = [
  "REQUESTED",
  "PURCHASING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

function fillTpl(template: string, vars: Record<string, string | number>) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

/** 홈 공지 목록: `2026.05.23 · 조회 3` 형식 (날짜는 항상 YYYY.MM.DD) */
function formatHomeNoticeMetaLine(iso: string, viewCount: number, viewsLabelTpl: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${y}.${m}.${day}`;
  return `${dateStr} · ${fillTpl(viewsLabelTpl, { n: viewCount })}`;
}

function formatKrwLine(amount: unknown, localeTag: string): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  const v = Number.isFinite(n) ? n : 0;
  return `₩${v.toLocaleString(localeTag, { maximumFractionDigits: 0 })}`;
}

export default function Home() {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const { getRecentPurchaseRequests, getMyPurchaseRequests } = usePurchase();
  const [ratesData, setRatesData] = useState<CurrentExchangeRates | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<QuoteCurrency>("KRW");
  const [baseAmountInput, setBaseAmountInput] = useState("1");
  const [myRequests, setMyRequests] = useState<PurchaseRequestListItem[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<Partial<Record<"ALL" | PurchaseRequestStatus, number>> | null>(
    null,
  );
  const [nickname, setNickname] = useState<string>(() => readAuthValue(STORAGE_KEYS.USER_NICKNAME) ?? "");

  const rateMap = useMemo(
    () => buildRateMap(Array.isArray(ratesData?.quotes) ? ratesData.quotes : undefined),
    [ratesData],
  );
  const quotes = Array.isArray(ratesData?.quotes) ? ratesData.quotes : [];
  const baseAmount = useMemo(() => normalizeBaseAmount(baseAmountInput), [baseAmountInput]);

  const inProgressCount =
    (summaryCounts?.REQUESTED ?? 0) + (summaryCounts?.PURCHASING ?? 0);
  const shippingCount = summaryCounts?.SHIPPING ?? 0;
  const completedCount = summaryCounts?.COMPLETED ?? 0;
  const cancelledCount = summaryCounts?.CANCELLED ?? 0;
  const totalActiveHint = summaryCounts?.ALL;

  useEffect(() => {
    const syncNick = () => setNickname(readAuthValue(STORAGE_KEYS.USER_NICKNAME) ?? "");
    window.addEventListener(USER_AUTH_CHANGE_EVENT, syncNick);
    return () => window.removeEventListener(USER_AUTH_CHANGE_EVENT, syncNick);
  }, []);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRatesData)
      .catch(() => setRatesData(null));

    getRecentPurchaseRequests()
      .then(setMyRequests)
      .catch(() => setMyRequests([]));

    api
      .get<PageResponse<Notice>>("/v1/notices?page=0&size=10")
      .then((res) => setRecentNotices(unwrap(res).content))
      .catch(() => setRecentNotices([]));
  }, [getCurrentExchangeRates, getRecentPurchaseRequests]);

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

  const currencyLabel = (c: QuoteCurrency) => t(`home.exchange.currencies.${c}`);

  const displayName = nickname.trim() || t("home.hero.fallbackName");

  const krwRubSummary =
    ratesData && ratesData.quotes.length > 0
      ? formatCrossRateLine("KRW", "RUB", rateMap, locale, 1000) ?? t("home.exchange.rateUnavailable")
      : null;

  const statusHint = (status: PurchaseRequestStatus) => t(`home.recentRequests.hint.${status}`);

  const dateLocale = useMemo(() => (locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US"), [locale]);

  const dashboardCards = useMemo(
    () =>
      [
        {
          key: "inProgress",
          count: inProgressCount,
          title: t("home.dashboard.inProgress"),
          desc: t("home.dashboard.desc.inProgress"),
          to: "/purchase?bucket=progress",
          icon: Package,
          highlight: false as const,
          className:
            "border border-gray-100/90 border-l-4 border-l-slate-500 bg-slate-50/90",
        },
        {
          key: "shipping",
          count: shippingCount,
          title: t("home.dashboard.shipping"),
          desc: t("home.dashboard.desc.shipping"),
          to: "/purchase?status=SHIPPING",
          icon: Truck,
          highlight: true as const,
          className:
            "border border-gray-100/90 border-l-4 border-l-blue-700 bg-blue-50/70",
        },
        {
          key: "completed",
          count: completedCount,
          title: t("home.dashboard.completed"),
          desc: t("home.dashboard.desc.completed"),
          to: "/purchase?status=COMPLETED",
          icon: CheckCircle2,
          highlight: false as const,
          className:
            "border border-gray-100/90 border-l-4 border-l-cyan-700 bg-cyan-50/50",
        },
        {
          key: "cancelled",
          count: cancelledCount,
          title: t("home.dashboard.cancelled"),
          desc: t("home.dashboard.desc.cancelled"),
          to: "/purchase?status=CANCELLED",
          icon: Ban,
          highlight: false as const,
          className:
            "border border-gray-100/90 border-l-4 border-l-rose-600 bg-rose-50/50",
        },
      ] as const,
    [t, inProgressCount, shippingCount, completedCount, cancelledCount],
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-5 text-gray-900 shadow-sm md:px-6 md:py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t("home.hero.contextLabel")}
            </p>
            <h1 className="mt-1 text-xl font-bold leading-tight text-gray-900 md:text-2xl">
              {fillTpl(t("home.hero.welcomeTitle"), { name: displayName })}
            </h1>
            <p className="mt-1.5 text-sm text-gray-700 md:text-[15px]">
              {fillTpl(t("home.hero.welcomeSubtitle"), {
                inProgress: inProgressCount,
                shipping: shippingCount,
                total: totalActiveHint ?? 0,
              })}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to="/purchase/new">
                <Button size="default" variant="default" className="font-semibold">
                  {t("home.hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/purchase">
                <Button size="default" variant="outline" className="border-gray-300 text-gray-900">
                  {t("home.hero.ctaSecondary")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch sm:items-center md:min-w-[200px] md:items-center">
            <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 text-center shadow-inner sm:max-w-none">
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-100/40 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-gray-200/40 blur-2xl" />
              <Package
                className="relative z-10 mx-auto h-14 w-14 text-gray-900 md:h-[4.5rem] md:w-[4.5rem]"
                strokeWidth={1.15}
                aria-hidden
              />
              <div className="relative z-10 mt-3 flex items-center justify-center gap-2 text-xs font-medium text-gray-800">
                <Truck className="h-4 w-4 shrink-0 text-gray-700" aria-hidden />
                <span>{t("home.hero.visualDelivery")}</span>
              </div>
              <div className="relative z-10 mt-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm">
                  {t("home.dashboard.inProgress")} · {inProgressCount}
                </span>
                <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm">
                  {t("home.dashboard.shipping")} · {shippingCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="home-dashboard-heading">
        <div className="mb-2 space-y-1">
          <h2 id="home-dashboard-heading" className="text-base font-semibold text-gray-900 md:text-lg">
            {t("home.dashboard.title")}
          </h2>
          <p className="text-xs text-gray-600 md:text-sm">{t("home.dashboard.subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {dashboardCards.map(({ key, count, title, desc, to, icon: Icon, highlight, className }) => (
            <Link key={key} to={to} className="block min-h-0">
              <Card
                className={cn(
                  "h-full shadow-sm",
                  className,
                  highlight &&
                    "relative z-0 shadow-[0_0_22px_rgba(30,64,175,0.28)] ring-2 ring-blue-300/55",
                )}
              >
                {highlight ? (
                  <span
                    className="absolute right-2.5 top-2.5 inline-flex h-2.5 w-2.5 rounded-full bg-blue-700 ring-2 ring-white md:right-3 md:top-3"
                    aria-hidden
                  />
                ) : null}
                <CardContent className={cn("flex flex-col gap-1.5 p-3 md:gap-2 md:p-4", highlight && "pr-8")}>
                  <div className="flex items-start justify-between gap-2">
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 md:h-6 md:w-6",
                        highlight ? "text-blue-800" : key === "completed" ? "text-cyan-800" : "text-gray-700",
                      )}
                      aria-hidden
                    />
                  </div>
                  <p
                    className={cn(
                      "text-xs font-semibold md:text-sm",
                      highlight ? "text-blue-950" : key === "completed" ? "text-cyan-950" : "text-gray-800",
                    )}
                  >
                    {title}
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-none text-gray-900 md:text-3xl">{count}</p>
                  <p className="text-[11px] leading-snug text-gray-600 md:text-xs">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="space-y-0 border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base md:text-lg">{t("home.recentRequests.title")}</CardTitle>
              <p className="mt-0.5 text-xs text-gray-500 md:text-sm">{t("home.recentRequests.subtitle")}</p>
            </div>
            <Link to="/purchase">
              <Button variant="ghost" size="sm" className="h-8 shrink-0 text-xs md:text-sm">
                {t("home.recentRequests.viewAll")}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {myRequests.length > 0 ? (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
              {myRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/purchase/${request.id}`}
                  className={cn(
                    "flex flex-col gap-1 px-3 py-2 text-left",
                    "md:flex-row md:items-center md:justify-between md:gap-4 md:py-2",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2 md:w-[35%] md:min-w-0 md:shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 px-2 py-0.5 text-[10px] font-semibold md:text-xs",
                        purchaseStatusBadgeClass(request.status),
                      )}
                    >
                      {t(`purchase.status.${request.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 md:text-[15px]">
                      {request.requestName}
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-gray-500 line-clamp-2 md:w-[40%] md:min-w-0 md:shrink md:line-clamp-1">
                    {statusHint(request.status)}
                  </p>
                  <span className="text-right text-base font-bold tabular-nums text-gray-900 md:w-[20%] md:shrink-0 md:text-base">
                    {formatKrwLine(request.totalAmountKrw, dateLocale)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 py-6 text-center text-gray-500">
              <ShoppingCart className="h-8 w-8 text-gray-300" aria-hidden />
              <p className="text-sm">{t("home.recentRequests.empty")}</p>
              <Link to="/purchase/new">
                <Button size="sm" variant="outline">
                  {t("home.hero.cta")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">{t("home.recentNotices.title")}</CardTitle>
            <Link to="/notice">
              <Button variant="ghost" size="sm" className="h-8 shrink-0 text-xs md:text-sm">
                {t("home.recentNotices.viewAll")}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {recentNotices.length > 0 ? (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
              {recentNotices.map((notice) => (
                <Link
                  key={notice.id}
                  to={`/notice/${notice.id}`}
                  className={cn(
                    "flex flex-col gap-1.5 px-3 py-2 text-left transition-colors hover:bg-gray-50/80",
                    "md:flex-row md:items-center md:justify-between md:gap-4 md:py-2",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2 md:min-w-0 md:flex-1">
                    {notice.isPinned ? (
                      <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px] font-semibold md:text-xs">
                        {t("home.notice.pinned")}
                      </Badge>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{notice.title}</span>
                  </div>
                  <time
                    dateTime={notice.createdAt}
                    className="shrink-0 text-xs tabular-nums text-gray-500 md:text-right"
                  >
                    {formatHomeNoticeMetaLine(notice.createdAt, notice.viewCount, t("home.recentNotices.viewsTpl"))}
                  </time>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50/50 px-3 py-4 text-center text-sm text-gray-500">
              {t("home.recentNotices.empty")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2 border-b border-gray-200 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 shrink-0 text-blue-600" />
              <CardTitle className="text-base md:text-lg">{t("home.exchange.title")}</CardTitle>
            </div>
            {ratesData?.fetchedAt ? (
              <Badge variant="secondary" className="text-[10px] font-normal md:text-xs">
                {formatDate(ratesData.fetchedAt, locale)} {t("home.exchange.asOf")}
              </Badge>
            ) : null}
          </div>
          {ratesData && ratesData.quotes.length > 0 ? (
            <p className="text-sm font-medium tabular-nums text-gray-900">{krwRubSummary}</p>
          ) : (
            <p className="text-sm text-gray-500">{t("home.exchange.loading")}</p>
          )}
          <CardDescription className="text-xs text-gray-500">{t("home.exchange.autoUpdate")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {quotes.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm text-gray-500">{t("home.exchange.baseCurrency")}</p>
                  <Tabs value={baseCurrency} onValueChange={(v) => setBaseCurrency(v as QuoteCurrency)}>
                    <TabsList className="grid w-full grid-cols-4">
                      {QUOTE_CURRENCIES.map((c) => (
                        <TabsTrigger key={c} value={c} className="text-xs sm:text-sm">
                          {c}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <Label htmlFor="exchange-base-amount" className="text-sm text-gray-500">
                    {t("home.exchange.baseAmount")}
                  </Label>
                  <Input
                    id="exchange-base-amount"
                    type="number"
                    min="0"
                    step="any"
                    className="mt-2"
                    value={baseAmountInput}
                    onChange={(e) => setBaseAmountInput(e.target.value)}
                    onBlur={() => {
                      const normalized = normalizeBaseAmount(baseAmountInput);
                      setBaseAmountInput(String(normalized));
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {t("home.exchange.baseAmountHint").replace("{{currency}}", baseCurrency)}
                  </p>
                </div>
              </div>
              <ul className="space-y-3 rounded-lg border bg-muted/30 p-4">
                {otherCurrencies(baseCurrency).map((target) => {
                  const line = formatCrossRateLine(baseCurrency, target, rateMap, locale, baseAmount);
                  return (
                    <li
                      key={target}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-lg font-semibold text-gray-900"
                    >
                      <span className="text-sm font-normal text-gray-500">{currencyLabel(target)}</span>
                      <span className="tabular-nums">{line ?? t("home.exchange.rateUnavailable")}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
