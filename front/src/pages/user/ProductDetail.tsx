import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DescriptionList, EmptyState, LoadingState, PageHeader, Section } from "../../components/page";
import { ProductImage, formatKrw, formatRubEquivalent } from "../../components/product/ProductCard";
import { useAuthGate } from "../../components/auth/AuthGate";
import { getProduct, purchaseRequestPathFor } from "../../api/product";
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

/** Public product page: photo on the left, the facts and the one action on the right. */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { isLoggedIn, requireLogin } = useAuthGate();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [product, setProduct] = useState<Product | null>(null);
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
    getProduct(numericId)
      .then((p) => {
        setProduct(p);
        setState("ready");
      })
      .catch(() => setState("missing"));
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
    <div className="space-y-10">
      <PageHeader
        back={{ to: "/products", label: t("products.back") }}
        title={product.name}
        meta={
          <>
            {product.isFeatured ? (
              <Badge className="bg-brand px-2 py-0 text-[11px] text-brand-foreground">{t("products.featured")}</Badge>
            ) : null}
            <span>{product.shopName}</span>
            {product.category ? <span>{product.category}</span> : null}
          </>
        }
        className="mb-0"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <ProductImage product={product} size="lg" />

        <div className="min-w-0 lg:pt-2">
          <p className="text-xs text-muted-foreground">{t("products.referencePrice")}</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] figure md:text-5xl">{formatKrw(product.priceKrw, locale)}</p>
          {rub ? <p className="mt-1 text-base text-muted-foreground figure">{rub}</p> : null}
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">{t("products.priceNote")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={handleRequest}>
              {t("products.request")}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                {t("products.viewShop")}
                <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden />
              </a>
            </Button>
          </div>

          <div className="mt-10">
            <DescriptionList
              items={[
                { key: "shop", label: t("products.shop"), value: product.shopName },
                ...(product.category ? [{ key: "category", label: t("products.category"), value: product.category }] : []),
                {
                  key: "link",
                  label: t("admin.products.field.url"),
                  value: (
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                    >
                      {hostnameOf(product.productUrl)}
                    </a>
                  ),
                },
              ]}
            />
          </div>

          {product.description ? (
            <Section title={t("admin.products.field.description")} className="mt-10">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
