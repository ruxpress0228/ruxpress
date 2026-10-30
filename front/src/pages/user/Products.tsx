import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Package, Search } from "lucide-react";
import { cn } from "../../components/ui/utils";
import { EmptyState, LoadingState, Pager } from "../../components/page";
import { ProductGrid } from "../../components/product/ProductCard";
import { getProductCategories, getProducts } from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { buildRateMap } from "../../utils/exchange";
import type { Product } from "../../types/product";
import type { CurrentExchangeRates } from "../../utils/exchange";

const PAGE_SIZE = 12;

/** Public catalogue: breadcrumb, centred title, a hairline toolbar, the grid. */
export default function Products() {
  const { t } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategoryState] = useState<string | null>(() => searchParams.get("category") || null);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
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

  // The URL is the source of truth for the category, so the browser's back button works.
  useEffect(() => {
    const fromUrl = searchParams.get("category") || null;
    setCategoryState((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [keyword]);

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
        setTotal(data.totalElements);
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(0);
        setTotal(null);
      })
      .finally(() => setLoading(false));
  }, [page, category, debouncedKeyword]);

  useEffect(() => {
    load();
  }, [load]);

  const chipClass = (active: boolean) =>
    cn(
      "eyebrow py-1 transition-colors",
      active ? "text-foreground underline underline-offset-[6px]" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div>
      {/* Breadcrumb and title */}
      <nav aria-label={t("products.breadcrumb")} className="flex items-center justify-center gap-2 text-[11px] tracking-[0.12em] text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          {t("nav.home")}
        </Link>
        <span aria-hidden>/</span>
        {category ? (
          <>
            <Link to="/products" className="transition-colors hover:text-foreground">
              {t("nav.products")}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground">{category}</span>
          </>
        ) : (
          <span className="text-foreground">{t("nav.products")}</span>
        )}
      </nav>
      <h1 className="page-title mt-5 text-center">{category ?? t("landing.categories.all")}</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{t("products.subtitle")}</p>

      {/* Toolbar: categories, count, search, on one hairline row */}
      <div className="mt-10 grid gap-4 border-y border-border py-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="-mx-5 flex gap-5 overflow-x-auto px-5 scrollbar-none md:mx-0 md:flex-wrap md:px-0" role="group" aria-label={t("products.category")}>
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chipClass(category === null)}>
            {t("products.all")}
          </button>
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chipClass(category === c)}>
              {c}
            </button>
          ))}
        </div>
        <p className="hidden text-[11px] tracking-[0.12em] text-muted-foreground figure md:block">
          {total != null ? t("products.count", { n: total }) : ""}
        </p>
        <label className="flex items-center gap-2 md:justify-self-end">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          <input
            type="search"
            className="h-8 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:w-56"
            placeholder={t("products.search")}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            aria-label={t("products.search")}
          />
        </label>
      </div>

      <div className="mt-10 md:mt-12">
        {loading ? (
          <LoadingState label={t("admin.common.loading")} />
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title={t("products.empty")} description={t("products.emptyDesc")} />
        ) : (
          <ProductGrid products={products} rateMap={rateMap} />
        )}
      </div>

      {totalPages > 1 ? (
        <Pager
          className="mt-12"
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
