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

/** 4:5 image box; a quiet typographic placeholder when there is no photo. */
export function ProductImage({ product, className, size = "sm" }: ProductImageProps) {
  const { t } = useTranslation();
  return (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden bg-muted", className)}>
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
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

/** Grid cell: image, shop, name, price. The whole cell links to the product page. */
export function ProductCard({ product, rateMap, className }: ProductCardProps) {
  const { t, locale } = useTranslation();
  const rub = formatRubEquivalent(product.priceKrw, rateMap, locale);
  return (
    <Link
      to={`/products/${product.id}`}
      className={cn(
        "group block min-w-0 border-b border-r border-border p-3 transition-colors hover:bg-muted/40 md:p-4",
        className,
      )}
    >
      <div className="relative">
        <ProductImage product={product} />
        {product.isFeatured ? (
          <Badge className="absolute left-2 top-2 px-1.5 py-0 text-[10px] font-medium">{t("products.featured")}</Badge>
        ) : null}
      </div>
      <p className="mt-3 truncate text-xs text-muted-foreground">{product.shopName}</p>
      <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
      <p className="mt-2 text-base figure">{formatKrw(product.priceKrw, locale)}</p>
      {rub ? <p className="text-xs text-muted-foreground figure">{rub}</p> : null}
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

/** Products in a grid that shares one hairline between cells. */
export function ProductGrid({ products, rateMap, columns = 4, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 border-l border-t border-border",
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
