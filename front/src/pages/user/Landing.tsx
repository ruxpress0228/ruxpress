import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Bell, Coins, MessageCircle, Wallet, type LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Section, SectionLink } from "../../components/page";
import { ExchangePanel } from "../../components/exchange/ExchangePanel";
import { ProductRail } from "../../components/product/ProductCard";
import { CategoryTiles } from "../../components/product/CategoryTiles";
import { LinkStartBar } from "../../components/landing/LinkStartBar";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { getFeaturedProducts, getProductCategories } from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap, formatCrossRateLine } from "../../utils/exchange";
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

const BENEFITS: { key: string; icon: LucideIcon; tint: string }[] = [
  { key: "rate", icon: Coins, tint: "bg-tint-butter" },
  { key: "escrow", icon: Wallet, tint: "bg-tint-mint" },
  { key: "chat", icon: MessageCircle, tint: "bg-tint-sky" },
  { key: "track", icon: Bell, tint: "bg-tint-lilac" },
];

/**
 * Guest home. The hero is the service itself: paste a shop link, start a request.
 * Everything below shows what is on offer (categories, products), how it works, and why to trust it.
 */
export default function Landing() {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const rateMap = useMemo(() => buildRateMap(rates?.quotes), [rates]);
  /** "1 RUB = 17.52 KRW" → label "1 RUB", value "17.52 KRW" for the hero card. */
  const headlineRate = useMemo(() => {
    const line = rates && rates.quotes.length > 0 ? formatCrossRateLine("RUB", "KRW", rateMap, locale, 1) : null;
    if (!line) return null;
    const idx = line.indexOf(" = ");
    return idx < 0 ? { base: null, value: line } : { base: line.slice(0, idx), value: line.slice(idx + 3) };
  }, [rates, rateMap, locale]);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRates)
      .catch(() => setRates(null));
    api
      .get<PageResponse<Notice>>("/v1/notices?page=0&size=3")
      .then((res) => setNotices(unwrap(res).content))
      .catch(() => setNotices([]));
    getFeaturedProducts(8)
      .then(setFeatured)
      .catch(() => setFeatured([]));
    getProductCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [getCurrentExchangeRates]);

  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`landing.how.${n}.title`),
    description: t(`landing.how.${n}.desc`),
  }));

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero: the promise, and the control that starts the job */}
      <section className="rounded-3xl bg-brand px-6 py-10 text-brand-foreground md:rounded-[2.5rem] md:px-12 md:py-16 lg:px-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-brand-foreground md:text-6xl">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-foreground/85 md:text-lg">
              {t("landing.hero.subtitle")}
            </p>
            <LinkStartBar className="mt-8 max-w-2xl" />
            <p className="max-w-lg text-sm text-brand-foreground/75">{t("landing.hero.note")}</p>
          </div>

          {headlineRate ? (
            <a
              href="#exchange"
              className="group block rounded-3xl bg-background p-6 text-foreground transition-transform duration-200 hover:-translate-y-0.5 md:p-7"
            >
              <p className="text-sm text-muted-foreground">
                {t("landing.rate.today")}
                {headlineRate.base ? <span className="figure"> · {headlineRate.base}</span> : null}
              </p>
              <p className="mt-3 text-3xl font-extrabold leading-none tracking-[-0.03em] figure md:text-4xl">
                {headlineRate.value}
              </p>
              <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
                {t("landing.rate.cta")}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </p>
            </a>
          ) : null}
        </div>
      </section>

      {/* Categories: what is on offer, one tile each */}
      {categories.length > 0 ? (
        <Section title={t("landing.categories.title")} flush>
          <CategoryTiles categories={categories} className="mt-6" />
        </Section>
      ) : null}

      {/* Featured products */}
      {featured.length > 0 ? (
        <Section
          title={t("landing.products.title")}
          action={<SectionLink to="/products">{t("common.viewAll")}</SectionLink>}
          flush
        >
          <ProductRail products={featured} rateMap={rateMap} className="mt-6" />
        </Section>
      ) : null}

      {/* How it works: a real sequence, so the steps are numbered */}
      <section aria-labelledby="landing-how" className="rounded-3xl bg-muted p-6 md:rounded-[2.5rem] md:p-12">
        <h2 id="landing-how" className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">
          {t("landing.how.title")}
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-4 md:block">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background figure">
                {step.n}
              </span>
              <div className="md:mt-5">
                <h3 className="text-lg font-semibold leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Why trust it: the features the service actually has */}
      <section aria-labelledby="landing-why">
        <h2 id="landing-why" className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">
          {t("landing.why.title")}
        </h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ key, icon: Icon, tint }) => (
            <li key={key}>
              <span className={`flex size-12 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold leading-snug">{t(`landing.why.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.why.${key}.desc`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Notices and the converter */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <Section
          title={t("home.recentNotices.title")}
          action={<SectionLink to="/notice">{t("home.recentNotices.viewAll")}</SectionLink>}
          flush
        >
          {notices.length > 0 ? (
            <ul>
              {notices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    to={`/notice/${notice.id}`}
                    className="flex items-center justify-between gap-4 border-b border-border py-4 transition-colors hover:text-brand"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {notice.isPinned ? (
                        <Badge className="bg-brand px-2 py-0 text-[11px] text-brand-foreground">
                          {t("home.notice.pinned")}
                        </Badge>
                      ) : null}
                      <span className="min-w-0 truncate text-sm font-medium">{notice.title}</span>
                    </span>
                    <time dateTime={notice.createdAt} className="shrink-0 text-xs text-muted-foreground figure">
                      {formatNoticeDate(notice.createdAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">{t("home.recentNotices.empty")}</p>
          )}
        </Section>
        <ExchangePanel id="exchange" ratesData={rates} />
      </div>

      {/* Closing invitation */}
      <section className="rounded-3xl bg-foreground px-6 py-12 text-background md:rounded-[2.5rem] md:px-12 md:py-16">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
          {t("landing.final.title")}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-background/70">{t("landing.final.desc")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button size="lg" variant="secondary" asChild className="bg-background text-foreground hover:bg-background/90">
            <Link to="/signup">{t("landing.cta.start")}</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild className="text-background hover:bg-background/10 hover:text-background">
            <Link to="/products">{t("landing.cta.browse")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
