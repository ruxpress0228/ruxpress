import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { cn } from "../../components/ui/utils";
import { EmptyState, PageHeader } from "../../components/page";
import { ProductGridSkeleton, ProductImage, formatKrw, formatRubEquivalent } from "../../components/product/ProductCard";
import { useWishlist } from "../../components/product/WishlistProvider";
import { getWishlist, removeWish } from "../../api/wishlist";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap } from "../../utils/exchange";
import { STORAGE_KEYS } from "../../utils/constants";
import type { WishlistItem } from "../../types/product";
import type { CurrentExchangeRates } from "../../utils/exchange";

/** Lines handed to the purchase form when the member starts a request from here. */
export type RequestPrefillLine = { name: string; url: string; shop: string; priceKrw: number };

/** Saved products, with a checkbox per item so several can become one purchase request. */
export default function Wishlist() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useWishlist();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);
  const rateMap = useMemo(() => buildRateMap(rates?.quotes), [rates]);

  const load = useCallback(() => {
    setLoading(true);
    getWishlist({ page: 0, size: 60 })
      .then((page) => setItems(page.content))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    getCurrentExchangeRates()
      .then(setRates)
      .catch(() => setRates(null));
  }, [load, getCurrentExchangeRates]);

  const allSelected = items.length > 0 && items.every((it) => selected.has(it.product.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((it) => it.product.id)));
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const remove = async (productId: number) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    try {
      await removeWish(productId);
      await refresh();
    } catch {
      toast.error(t("wishlist.failed"));
      load();
    }
  };

  const startRequest = () => {
    const chosen = items.filter((it) => selected.has(it.product.id));
    if (chosen.length === 0) return;
    const lines: RequestPrefillLine[] = chosen.map(({ product }) => ({
      name: product.name,
      url: product.productUrl,
      shop: product.shopName,
      priceKrw: product.priceKrw,
    }));
    try {
      sessionStorage.setItem(STORAGE_KEYS.REQUEST_PREFILL, JSON.stringify(lines));
    } catch {
      // Falls back to an empty form; the member can still fill it in.
    }
    navigate("/purchase/new?from=wishlist");
  };

  return (
    <div>
      <PageHeader align="center" title={t("wishlist.title")} description={t("wishlist.subtitle")} />

      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("wishlist.emptyTitle")}
          description={t("wishlist.emptyDesc")}
          action={
            <Button variant="outline" asChild>
              <Link to="/products">{t("landing.cta.browse")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label={t("wishlist.selectAll")} />
              {t("wishlist.selectAll")}
              <span className="text-muted-foreground figure">
                {selected.size}/{items.length}
              </span>
            </label>
            <Button size="sm" disabled={selected.size === 0} onClick={startRequest}>
              {t("wishlist.requestSelected")}
            </Button>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {items.map(({ product }) => {
              const checked = selected.has(product.id);
              const rub = formatRubEquivalent(product.priceKrw, rateMap, locale);
              return (
                <li key={product.id} className={cn("group relative", checked && "outline outline-1 outline-offset-4 outline-foreground")}>
                  <Link to={`/products/${product.id}`} className="block">
                    <ProductImage product={product} />
                  </Link>
                  <label className="absolute left-2 top-2 flex size-8 items-center justify-center bg-background/85 backdrop-blur-sm">
                    <Checkbox checked={checked} onCheckedChange={() => toggleOne(product.id)} aria-label={product.name} />
                  </label>
                  <button
                    type="button"
                    onClick={() => void remove(product.id)}
                    aria-label={t("wishlist.remove")}
                    title={t("wishlist.remove")}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center bg-background/85 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                  >
                    <X className="size-4" strokeWidth={1.5} aria-hidden />
                  </button>
                  <p className="mt-3 truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{product.shopName}</p>
                  <Link to={`/products/${product.id}`} className="mt-1.5 line-clamp-2 block text-xs font-light leading-snug tracking-[0.04em]">
                    {product.name}
                  </Link>
                  <p className="mt-1.5 text-xs figure">
                    {formatKrw(product.priceKrw, locale)}
                    {rub ? <span className="text-muted-foreground"> {rub}</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
