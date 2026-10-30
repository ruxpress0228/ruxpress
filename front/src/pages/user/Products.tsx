import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Search, Package } from "lucide-react";
import { Input } from "../../components/ui/input";
import { cn } from "../../components/ui/utils";
import { EmptyState, LoadingState, PageHeader, Pager } from "../../components/page";
import { ProductGrid } from "../../components/product/ProductCard";
import { getProductCategories, getProducts } from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap } from "../../utils/exchange";
import type { Product } from "../../types/product";
import type { CurrentExchangeRates } from "../../utils/exchange";

const PAGE_SIZE = 12;

/** Public catalogue: category chips, search, product grid, pager. */
export default function Products() {
  const { t } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategoryState] = useState<string | null>(() => searchParams.get("category") || null);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);

  const rateMap = useMemo(() => buildRateMap(rates?.quotes), [rates]);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRates)
      .catch(() => setRates(null));
    getProductCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [getCurrentExchangeRates]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [keyword]);

  /** Category lives in the URL so a tile on the landing page can link straight to it. */
  const setCategory = (next: string | null) => {
    setCategoryState(next);
    setPage(0);
    setSearchParams(next ? { category: next } : {}, { replace: true });
  };

  const load = useCallback(() => {
    setLoading(true);
    getProducts({ page, size: PAGE_SIZE, category, keyword: debouncedKeyword })
      .then((data) => {
        setProducts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, category, debouncedKeyword]);

  useEffect(() => {
    load();
  }, [load]);

  const chipClass = (active: boolean) =>
    cn(
      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
      active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("products.title")} description={t("products.subtitle")} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("products.category")}>
          <button
            type="button"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className={chipClass(category === null)}
          >
            {t("products.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={chipClass(category === c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            className="rounded-full bg-muted pl-9"
            placeholder={t("products.search")}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            aria-label={t("products.search")}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label={t("admin.common.loading")} />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title={t("products.empty")} description={t("products.emptyDesc")} />
      ) : (
        <ProductGrid products={products} rateMap={rateMap} />
      )}

      {totalPages > 1 ? (
        <Pager
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          prevLabel={t("admin.common.prev")}
          nextLabel={t("admin.common.next")}
        />
      ) : null}
    </div>
  );
}
