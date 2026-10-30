import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { Section, SectionLink } from "../../components/page";
import { Button as ViewAllButton } from "../../components/ui/button";
import { ExchangePanel } from "../../components/exchange/ExchangePanel";
import { ProductRail } from "../../components/product/ProductCard";
import { CategoryTiles } from "../../components/product/CategoryTiles";
import { LinkStartBar } from "../../components/landing/LinkStartBar";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { getFeaturedProducts, getProductCategories, getProducts } from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap, formatCrossRateLine } from "../../utils/exchange";
import type { Notice, PageResponse } from "../../types";
import type { Product } from "../../types/product";
import type { CurrentExchangeRates } from "../../utils/exchange";

const SLIDE_INTERVAL_MS = 6000;
const MAX_SLIDES = 5;

function formatNoticeDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Guest home. A full-width showcase of the shop's own product photos carries the
 * promise and the one control that starts the job; below it the catalogue,
 * how it works, the rate, and the latest notices.
 */
export default function Landing() {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const reducedMotion = usePrefersReducedMotion();
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const rateMap = useMemo(() => buildRateMap(rates?.quotes), [rates]);
  const headlineRate = useMemo(
    () => (rates && rates.quotes.length > 0 ? formatCrossRateLine("RUB", "KRW", rateMap, locale, 1) : null),
    [rates, rateMap, locale],
  );
  const slides = useMemo(() => featured.filter((p) => p.imageUrl).slice(0, MAX_SLIDES), [featured]);

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
    getProducts({ page: 0, size: 48 })
      .then((page) => setCatalogue(page.content))
      .catch(() => setCatalogue([]));
  }, [getCurrentExchangeRates]);

  // The showcase advances on its own unless the visitor is looking closely or prefers no motion.
  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion) return;
    const handle = window.setInterval(() => setSlide((i) => (i + 1) % slides.length), SLIDE_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, [slides.length, paused, reducedMotion]);

  useEffect(() => {
    if (slide >= slides.length) setSlide(0);
  }, [slide, slides.length]);

  const current = slides[slide];
  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`landing.how.${n}.title`),
    description: t(`landing.how.${n}.desc`),
  }));
  const facts = ["rate", "escrow", "chat", "track"] as const;

  return (
    <div className="-mt-8 space-y-20 md:-mt-10 md:space-y-28">
      {/* Showcase: the shop's own photos, edge to edge, with the promise over them */}
      <section
        aria-label={t("landing.hero.eyebrow")}
        className="full-bleed flex min-h-[72vh] flex-col justify-end bg-foreground text-background md:min-h-[82vh]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {slides.map((p, i) => (
          <img
            key={p.id}
            src={p.imageUrl ?? undefined}
            alt=""
            aria-hidden={i !== slide}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-out",
              i === slide ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        {slides.length > 0 ? (
          <>
            {/* Scrims keep the header and the text legible whatever the photo */}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" aria-hidden />
            <span className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" aria-hidden />
          </>
        ) : null}

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-24 md:px-6 md:pb-14">
          <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <div className="hidden md:block" aria-hidden />
            <div className="mx-auto min-w-0 max-w-2xl text-center">
              <p className="text-[11px] uppercase tracking-[0.24em] text-background/80">{t("landing.hero.eyebrow")}</p>
              <h1 className="mt-4 text-4xl font-light leading-[1.1] tracking-[0.02em] text-background md:text-5xl lg:text-6xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-background/80 md:text-base">
                {t("landing.hero.subtitle")}
              </p>
              <LinkStartBar tone="onDark" className="mx-auto mt-8 max-w-xl text-left" />
            </div>

            {current ? (
              <div className="flex items-end justify-between gap-6 md:flex-col md:items-end md:text-right">
                <Link to={`/products/${current.id}`} className="min-w-0 transition-opacity hover:opacity-80">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-background/70">
                    {t("products.featured")}
                  </span>
                  <span className="mt-1 block truncate text-sm">{current.name}</span>
                </Link>
                {slides.length > 1 ? (
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11px] text-background/70 figure">
                      {String(slide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </span>
                    <div className="flex items-center gap-1.5" role="tablist" aria-label={t("products.featured")}>
                      {slides.map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          role="tab"
                          aria-selected={i === slide}
                          aria-label={p.name}
                          onClick={() => setSlide(i)}
                          className={cn(
                            "size-1.5 rounded-full transition-colors",
                            i === slide ? "bg-background" : "bg-background/40 hover:bg-background/70",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Today's rate, one quiet line */}
      {headlineRate ? (
        <div className="-mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border pb-4 text-[11px] uppercase tracking-[0.16em] md:-mt-20">
          <span className="text-muted-foreground">{t("landing.rate.today")}</span>
          <span className="figure">{headlineRate}</span>
          <a href="#exchange" className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
            {t("landing.rate.cta")}
          </a>
        </div>
      ) : null}

      {/* Categories: dark panels in the shop's own photos */}
      {categories.length > 0 ? (
        <section aria-labelledby="landing-categories">
          <h2 id="landing-categories" className="store-title">
            {t("landing.categories.title")}
          </h2>
          <CategoryTiles categories={categories} products={catalogue} className="mt-8" />
        </section>
      ) : null}

      {/* Featured products */}
      {featured.length > 0 ? (
        <section aria-labelledby="landing-featured">
          <h2 id="landing-featured" className="store-title">
            {t("landing.products.title")}
          </h2>
          <ProductRail products={featured} rateMap={rateMap} className="mt-8" />
          <div className="mt-10 flex justify-center">
            <ViewAllButton variant="outline" asChild>
              <Link to="/products">{t("common.viewAll")}</Link>
            </ViewAllButton>
          </div>
        </section>
      ) : null}

      {/* The statement, then the facts behind it */}
      <section className="border-t border-foreground pt-10 md:pt-14">
        <p className="mx-auto max-w-3xl text-center text-2xl font-light leading-snug tracking-[-0.01em] md:text-4xl">
          {t("landing.statement")}
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 md:mt-16 md:grid-cols-4 md:gap-6">
          {facts.map((key) => (
            <li key={key} className="border-t border-border pt-4">
              <h3 className="text-sm font-medium">{t(`landing.why.${key}.title`)}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`landing.why.${key}.desc`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works: a real sequence, so the steps are numbered */}
      <section aria-labelledby="landing-how">
        <h2 id="landing-how" className="store-title">
          {t("landing.how.title")}
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step) => (
            <li key={step.n} className="border-t border-border pt-4">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground figure">0{step.n}</span>
              <h3 className="mt-6 text-lg font-light leading-snug md:text-xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Notices and the rate */}
      <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
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
          ) : (
            <p className="border-b border-border py-8 text-sm text-muted-foreground">{t("home.recentNotices.empty")}</p>
          )}
        </Section>
        <ExchangePanel ratesData={rates} className="scroll-mt-24" id="exchange" />
      </div>

      {/* Closing invitation */}
      <section className="border-t border-foreground py-14 text-center md:py-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{t("landing.hero.eyebrow")}</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-light leading-tight md:text-5xl">{t("landing.final.title")}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
          {t("landing.final.desc")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button size="lg" asChild>
            <Link to="/signup">{t("landing.cta.start")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/products">{t("landing.cta.browse")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
