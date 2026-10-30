import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Package } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { krwToQuote } from "../../utils/exchange";
import type { Product } from "../../types/product";

export function localeTagOf(locale: string): string {
  return locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
}

export function formatKrw(amount: number, locale: string): string {
  return `₩${amount.toLocaleString(localeTagOf(locale), { maximumFractionDigits: 0 })}`;
}

export function formatRubEquivalent(amountKrw: number, rateMap: Map<string, number> | undefined, locale: string): string | null {
  if (!rateMap) return null;
  const rub = krwToQuote(amountKrw, "RUB", rateMap);
  if (rub == null) return null;
  return `≈ ₽${rub.toLocaleString(localeTagOf(locale), { maximumFractionDigits: 0 })}`;
}

type ProductImageProps = {
  product: Pick<Product, "imageUrl" | "name" | "shopName">;
  className?: string;
  /** `xs` is a table thumbnail (icon only); `lg` is the detail page. */
  size?: "xs" | "sm" | "lg";
};

const PLACEHOLDER_ICON: Record<NonNullable<ProductImageProps["size"]>, string> = {
  xs: "size-4",
  sm: "size-6",
  lg: "size-10",
};

/**
 * 4:5 image box; a quiet typographic placeholder when there is no photo or it fails to load.
 * Inside a card the photo drifts in very slightly on hover.
 */
export function ProductImage({ product, className, size = "sm" }: ProductImageProps) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.imageUrl]);
  const showImage = Boolean(product.imageUrl) && !failed;
  return (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden bg-muted", className)}>
      {showImage ? (
        <img
          src={product.imageUrl ?? undefined}
          alt={product.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
          aria-label={size === "xs" ? t("products.noImage") : undefined}
        >
          <Package className={PLACEHOLDER_ICON[size]} strokeWidth={1} aria-hidden />
          {size !== "xs" ? (
            <span className="text-[11px] uppercase tracking-[0.14em]">{t("products.noImage")}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

type ProductCardProps = {
  product: Product;
  rateMap?: Map<string, number>;
  className?: string;
};

/** Catalogue cell: photo, shop in small capitals, name, price. The whole cell links to the product page. */
export function ProductCard({ product, rateMap, className }: ProductCardProps) {
  const { t, locale } = useTranslation();
  const rub = formatRubEquivalent(product.priceKrw, rateMap, locale);
  return (
    <Link to={`/products/${product.id}`} className={cn("group block min-w-0", className)}>
      <div className="relative">
        <ProductImage product={product} />
        {product.isFeatured ? (
          <Badge className="absolute left-2 top-2 px-1.5 py-0 text-[10px] font-medium">{t("products.featured")}</Badge>
        ) : null}
      </div>
      <p className="mt-3 truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{product.shopName}</p>
      <h3 className="mt-1 line-clamp-2 text-[13px] font-normal leading-snug">{product.name}</h3>
      <p className="mt-1.5 text-[13px] figure">
        {formatKrw(product.priceKrw, locale)}
        {rub ? <span className="text-muted-foreground"> {rub}</span> : null}
      </p>
    </Link>
  );
}

type ProductGridProps = {
  products: Product[];
  rateMap?: Map<string, number>;
  /** Desktop column count; phones always show two. */
  columns?: 3 | 4;
  className?: string;
};

/** Products in a quiet grid: whitespace between cells, no rules. */
export function ProductGrid({ products, rateMap, columns = 4, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6",
        columns === 4 ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3",
        className,
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} rateMap={rateMap} />
      ))}
    </div>
  );
}

type ProductRailProps = {
  products: Product[];
  rateMap?: Map<string, number>;
  className?: string;
};

/** A swipeable row on phones that becomes a four-column grid on desktop. */
export function ProductRail({ products, rateMap, className }: ProductRailProps) {
  return (
    <div
      className={cn(
        "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 scrollbar-none",
        "md:mx-0 md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-10 md:overflow-visible md:px-0",
        className,
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} rateMap={rateMap} className="w-[58%] shrink-0 snap-start sm:w-[38%] md:w-auto" />
      ))}
    </div>
  );
}
