import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { EmptyState, LoadingState } from "../../components/page";
import { ProductGrid, ProductImage, formatKrw, formatRubEquivalent } from "../../components/product/ProductCard";
import { useAuthGate } from "../../components/auth/AuthGate";
import { getFeaturedProducts, getProduct, getProducts, purchaseRequestPathFor } from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap } from "../../utils/exchange";
import type { Product } from "../../types/product";
import type { CurrentExchangeRates } from "../../utils/exchange";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Public product page: the photo on the left, the facts and the one action on the right, related products below. */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { isLoggedIn, requireLogin } = useAuthGate();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);

  const rateMap = useMemo(() => buildRateMap(rates?.quotes), [rates]);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRates)
      .catch(() => setRates(null));
  }, [getCurrentExchangeRates]);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setState("missing");
      return;
    }
    setState("loading");
    setRelated([]);
    getProduct(numericId)
      .then((p) => {
        setProduct(p);
        setState("ready");
        window.scrollTo({ top: 0 });
        return getProducts({ page: 0, size: 8, category: p.category ?? undefined });
      })
      .then(async (page) => {
        // Same category first; when the category has nothing else yet, show the featured picks instead.
        let others = page.content.filter((x) => x.id !== numericId);
        if (others.length === 0) {
          others = (await getFeaturedProducts(5)).filter((x) => x.id !== numericId);
        }
        setRelated(others.slice(0, 4));
      })
      .catch(() => setState((s) => (s === "ready" ? s : "missing")));
  }, [id]);

  if (state === "loading") {
    return <LoadingState label={t("admin.common.loading")} />;
  }

  if (state === "missing" || !product) {
    return (
      <EmptyState
        title={t("products.notFound")}
        action={
          <Button variant="outline" asChild>
            <Link to="/products">{t("products.back")}</Link>
          </Button>
        }
      />
    );
  }

  const requestPath = purchaseRequestPathFor(product);
  const rub = formatRubEquivalent(product.priceKrw, rateMap, locale);

  const handleRequest = () => {
    if (isLoggedIn || requireLogin(requestPath)) {
      navigate(requestPath);
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label={t("products.breadcrumb")} className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.12em] text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          {t("nav.home")}
        </Link>
        <span aria-hidden>/</span>
        <Link to="/products" className="transition-colors hover:text-foreground">
          {t("nav.products")}
        </Link>
        {product.category ? (
          <>
            <span aria-hidden>/</span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="transition-colors hover:text-foreground">
              {product.category}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <ProductImage product={product} size="lg" />

        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{product.shopName}</p>
          <h1 className="mt-3 text-xl font-light leading-snug tracking-[0.06em] md:text-2xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-base figure">{formatKrw(product.priceKrw, locale)}</p>
            {rub ? <p className="text-sm text-muted-foreground figure">{rub}</p> : null}
            {product.isFeatured ? <Badge variant="outline">{t("products.featured")}</Badge> : null}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("products.priceNote")}</p>

          <div className="mt-8 space-y-2">
            <Button size="lg" className="w-full" onClick={handleRequest}>
              {t("products.request")}
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                {t("products.viewShop")}
                <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden />
              </a>
            </Button>
          </div>

          {/* Details, folded */}
          <p className="eyebrow mt-10 text-muted-foreground">{t("products.details")}</p>
          <Accordion type="multiple" defaultValue={product.description ? ["description"] : ["howTo"]} className="mt-2 border-t border-border">
            {product.description ? (
              <AccordionItem value="description" className="border-border">
                <AccordionTrigger className="py-4 text-sm font-normal hover:no-underline">
                  {t("admin.products.field.description")}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            <AccordionItem value="shop" className="border-border">
              <AccordionTrigger className="py-4 text-sm font-normal hover:no-underline">{t("products.shop")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <p>{product.shopName}</p>
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                >
                  {hostnameOf(product.productUrl)}
                </a>
                {product.category ? (
                  <p className="mt-3">
                    {t("products.category")}: {product.category}
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="howTo" className="border-border">
              <AccordionTrigger className="py-4 text-sm font-normal hover:no-underline">{t("products.details.howTo")}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {t("products.details.howToDesc")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20 border-t border-border pt-10 md:mt-28 md:pt-14">
          <h2 className="store-title">{t("products.related")}</h2>
          <ProductGrid products={related} rateMap={rateMap} className="mt-10" />
        </section>
      ) : null}
    </div>
  );
}
