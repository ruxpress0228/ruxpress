import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { ShoppingCart, Package, Truck, CheckCircle2, Ban, type LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { Section, SectionLink } from "../../components/page";
import { ExchangePanel } from "../../components/exchange/ExchangePanel";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import { api, readAuthValue } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { formatNumber } from "../../utils/format";
import { useBalance } from "../../hooks/balance/useBalance";
import { BalanceEquivalents } from "../../components/balance/BalanceEquivalents";
import { STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import type { Notice, PageResponse } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";
import type { PurchaseRequestStatus } from "../../types";
import type { CurrentExchangeRates } from "../../utils/exchange";

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
  const [myRequests, setMyRequests] = useState<PurchaseRequestListItem[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<Partial<Record<"ALL" | PurchaseRequestStatus, number>> | null>(
    null,
  );
  const [nickname, setNickname] = useState<string>(() => readAuthValue(STORAGE_KEYS.USER_NICKNAME) ?? "");
  const isLoggedIn = Boolean(readAuthValue(STORAGE_KEYS.TOKEN));
  const { balance } = useBalance();

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

  const displayName = nickname.trim() || t("home.hero.fallbackName");

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
          highlight: false,
        },
        {
          key: "shipping",
          count: shippingCount,
          title: t("home.dashboard.shipping"),
          desc: t("home.dashboard.desc.shipping"),
          to: "/purchase?status=SHIPPING",
          icon: Truck,
          highlight: true,
        },
        {
          key: "completed",
          count: completedCount,
          title: t("home.dashboard.completed"),
          desc: t("home.dashboard.desc.completed"),
          to: "/purchase?status=COMPLETED",
          icon: CheckCircle2,
          highlight: false,
        },
        {
          key: "cancelled",
          count: cancelledCount,
          title: t("home.dashboard.cancelled"),
          desc: t("home.dashboard.desc.cancelled"),
          to: "/purchase?status=CANCELLED",
          icon: Ban,
          highlight: false,
        },
      ] satisfies { key: string; count: number; title: string; desc: string; to: string; icon: LucideIcon; highlight: boolean }[],
    [t, inProgressCount, shippingCount, completedCount, cancelledCount],
  );

  return (
    <div className="space-y-14 md:space-y-20">
      {/* Greeting + wallet */}
      <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] md:items-end md:gap-12">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{t("home.hero.contextLabel")}</p>
          <h1 className="mt-3 text-4xl leading-[1.08] md:text-5xl">
            {fillTpl(t("home.hero.welcomeTitle"), { name: displayName })}
          </h1>
          <p className="mt-4 text-base text-muted-foreground figure">
            {fillTpl(t("home.hero.welcomeSubtitle"), {
              inProgress: inProgressCount,
              shipping: shippingCount,
              total: totalActiveHint ?? 0,
            })}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to="/purchase/new">{t("home.hero.cta")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/purchase">{t("home.hero.ctaSecondary")}</Link>
            </Button>
          </div>
        </div>

        {isLoggedIn ? (
          <Link
            to="/wallet"
            className="block border border-border p-5 transition-colors hover:bg-muted/60 md:p-6"
          >
            <p className="text-xs text-muted-foreground">{t("home.walletBalance.label")}</p>
            <p className="mt-3 text-3xl font-medium figure md:text-4xl">
              {balance == null
                ? "—"
                : `₩${formatNumber(balance, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <BalanceEquivalents
              balance={balance}
              hintKey="wallet.balanceEquivalentsHint"
              className="mt-1 text-sm text-muted-foreground figure"
            />
            <p className="mt-5 text-xs underline underline-offset-4 decoration-foreground/30">
              {t("home.walletBalance.link")}
            </p>
          </Link>
        ) : null}
      </section>

      {/* Order status strip */}
      <section aria-labelledby="home-dashboard-heading">
        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
          <h2 id="home-dashboard-heading">{t("home.dashboard.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("home.dashboard.subtitle")}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 border-l border-t border-border md:grid-cols-4">
          {dashboardCards.map(({ key, count, title, desc, to, icon: Icon, highlight }) => (
            <Link
              key={key}
              to={to}
              className="group border-b border-r border-border p-4 transition-colors hover:bg-muted/60 md:p-5"
            >
              <div className="flex items-center gap-2 text-sm">
                <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                <span className="font-medium">{title}</span>
                {highlight ? (
                  <span className="ml-auto size-1.5 rounded-full bg-foreground" aria-hidden />
                ) : null}
              </div>
              <p className="mt-5 text-4xl font-light figure md:text-5xl">{count}</p>
              <p className="mt-3 text-xs leading-snug text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity + exchange */}
      <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div className="min-w-0 space-y-14">
          <Section
            id="home-recent-heading"
            title={t("home.recentRequests.title")}
            action={<SectionLink to="/purchase">{t("home.recentRequests.viewAll")}</SectionLink>}
            flush
          >
            {myRequests.length > 0 ? (
              <ul>
                {myRequests.map((request) => (
                  <li key={request.id}>
                    <Link
                      to={`/purchase/${request.id}`}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3.5 transition-colors hover:bg-muted/60 md:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
                    >
                      <Badge
                        variant="outline"
                        className={cn("px-2 py-0.5 text-[10px] font-medium", purchaseStatusBadgeClass(request.status))}
                      >
                        {t(`purchase.status.${request.status}` as `purchase.status.${PurchaseRequestStatus}`)}
                      </Badge>
                      <span className="min-w-0 truncate text-sm font-medium">{request.requestName}</span>
                      <span className="hidden min-w-0 truncate text-xs text-muted-foreground md:inline">
                        {statusHint(request.status)}
                      </span>
                      <span className="text-sm font-medium figure">
                        {formatKrwLine(request.totalAmountKrw, dateLocale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3 border-b border-border py-8">
                <ShoppingCart className="size-6 text-muted-foreground" strokeWidth={1.25} aria-hidden />
                <p className="text-sm text-muted-foreground">{t("home.recentRequests.empty")}</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/purchase/new">{t("home.hero.cta")}</Link>
                </Button>
              </div>
            )}
          </Section>

          <Section
            id="home-notices-heading"
            title={t("home.recentNotices.title")}
            action={<SectionLink to="/notice">{t("home.recentNotices.viewAll")}</SectionLink>}
            flush
          >
            {recentNotices.length > 0 ? (
              <ul>
                {recentNotices.map((notice) => (
                  <li key={notice.id}>
                    <Link
                      to={`/notice/${notice.id}`}
                      className="flex items-center justify-between gap-4 border-b border-border py-3.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {notice.isPinned ? (
                          <Badge className="px-1.5 py-0 text-[10px] font-medium">{t("home.notice.pinned")}</Badge>
                        ) : null}
                        <span className="min-w-0 truncate text-sm">{notice.title}</span>
                      </span>
                      <time
                        dateTime={notice.createdAt}
                        className="shrink-0 text-xs text-muted-foreground figure"
                      >
                        {formatHomeNoticeMetaLine(notice.createdAt, notice.viewCount, t("home.recentNotices.viewsTpl"))}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-b border-border py-8 text-sm text-muted-foreground">
                {t("home.recentNotices.empty")}
              </p>
            )}
          </Section>
        </div>

        {/* Exchange panel: the one dark block on the page */}
        <ExchangePanel ratesData={ratesData} />
      </div>
    </div>
  );
}
