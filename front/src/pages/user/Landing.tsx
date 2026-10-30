import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, FileText, MessageSquare, ShoppingCart, type LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Section, SectionLink } from "../../components/page";
import { ExchangePanel } from "../../components/exchange/ExchangePanel";
import { ProductGrid } from "../../components/product/ProductCard";
import { useAuthGate } from "../../components/auth/AuthGate";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { getFeaturedProducts } from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap } from "../../utils/exchange";
import type { Notice, PageResponse } from "../../types";
import type { Product } from "../../types/product";
import type { CurrentExchangeRates } from "../../utils/exchange";

function formatNoticeDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

type ServiceRow = {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  /** Public pages link directly; account features go through the login gate. */
  to: string;
  gated: boolean;
};

/** Guest home: what the service does, today's rate, how it works, and the latest notices. */
export default function Landing() {
  const { t } = useTranslation();
  const { requireLogin } = useAuthGate();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const rateMap = useMemo(() => buildRateMap(rates?.quotes), [rates]);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRates)
      .catch(() => setRates(null));
    api
      .get<PageResponse<Notice>>("/v1/notices?page=0&size=3")
      .then((res) => setNotices(unwrap(res).content))
      .catch(() => setNotices([]));
    getFeaturedProducts(4)
      .then(setFeatured)
      .catch(() => setFeatured([]));
  }, [getCurrentExchangeRates]);

  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`landing.how.${n}.title`),
    description: t(`landing.how.${n}.desc`),
  }));

  const services: ServiceRow[] = [
    {
      key: "purchase",
      icon: ShoppingCart,
      title: t("home.quick.purchase.title"),
      description: t("home.quick.purchase.desc"),
      action: t("home.hero.cta"),
      to: "/purchase/new",
      gated: true,
    },
    {
      key: "inquiry",
      icon: MessageSquare,
      title: t("home.quick.inquiry.title"),
      description: t("home.quick.inquiry.desc"),
      action: t("landing.services.inquiry.action"),
      to: "/inquiry/new",
      gated: true,
    },
    {
      key: "notice",
      icon: FileText,
      title: t("home.quick.notice.title"),
      description: t("home.quick.notice.desc"),
      action: t("landing.services.notice.action"),
      to: "/notice",
      gated: false,
    },
  ];

  const rowClass =
    "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-5 text-left transition-colors hover:bg-muted/60 md:gap-6";

  return (
    <div className="space-y-20 md:space-y-28">
      {/* Hero: the promise, and the number that matters today */}
      <section className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] md:items-center md:gap-16">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <h1 className="mt-4 text-4xl leading-[1.05] md:text-6xl">{t("home.hero.title")}</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("home.hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Button size="lg" asChild>
              <Link to="/signup">{t("landing.cta.start")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
          </div>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-muted-foreground">{t("landing.hero.note")}</p>
        </div>
        <ExchangePanel ratesData={rates} />
      </section>

      {/* Featured products: what people actually order through the service */}
      {featured.length > 0 ? (
        <Section
          title={t("landing.products.title")}
          action={<SectionLink to="/products">{t("common.viewAll")}</SectionLink>}
          flush
        >
          <ProductGrid products={featured} rateMap={rateMap} />
        </Section>
      ) : null}

      {/* How it works: a real sequence, so the steps are numbered */}
      <Section title={t("landing.how.title")} flush>
        <ol className="grid border-l border-border md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="border-b border-r border-border p-6 md:p-8">
              <span className="text-xs text-muted-foreground figure">0{step.n}</span>
              <h3 className="mt-8 text-lg leading-snug">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Services: each row leads to the feature; account features open the login sheet */}
      <Section title={t("landing.services.title")} flush>
        <ul>
          {services.map(({ key, icon: Icon, title, description, action, to, gated }) => {
            const inner = (
              <>
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-base font-medium">{title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  <span className="hidden sm:inline">{action}</span>
                  <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
              </>
            );
            return (
              <li key={key}>
                {gated ? (
                  <button type="button" onClick={() => requireLogin(to)} className={rowClass}>
                    {inner}
                  </button>
                ) : (
                  <Link to={to} className={rowClass}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Latest notices: public, so guests can see the service is alive */}
      {notices.length > 0 ? (
        <Section
          title={t("home.recentNotices.title")}
          action={<SectionLink to="/notice">{t("home.recentNotices.viewAll")}</SectionLink>}
          flush
        >
          <ul>
            {notices.map((notice) => (
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
                  <time dateTime={notice.createdAt} className="shrink-0 text-xs text-muted-foreground figure">
                    {formatNoticeDate(notice.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Closing invitation */}
      <section className="border-y border-foreground py-14 md:py-20">
        <h2 className="max-w-2xl text-3xl font-light leading-tight md:text-5xl">{t("landing.final.title")}</h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{t("landing.final.desc")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button size="lg" asChild>
            <Link to="/signup">{t("landing.cta.start")}</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link to="/login">{t("nav.login")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
