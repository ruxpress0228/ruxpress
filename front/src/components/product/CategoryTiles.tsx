import { Link } from "react-router";
import { cn } from "../ui/utils";
import { useTranslation } from "../../hooks/useTranslation";
import type { Product } from "../../types/product";

type CategoryTilesProps = {
  categories: string[];
  /** Catalogue items; the first photo in each category becomes the tile image. */
  products: Product[];
  /** Keep the block to two rows on desktop; the rest is reachable from the last tile. */
  max?: number;
  className?: string;
};

/**
 * Dark image panels, one per category, the name set in spaced capitals.
 * A category without a photo yet is a plain black panel.
 */
export function CategoryTiles({ categories, products, max = 7, className }: CategoryTilesProps) {
  const { t } = useTranslation();
  const shown = categories.slice(0, max);
  const coverFor = (category: string) => products.find((p) => p.category === category && p.imageUrl)?.imageUrl ?? null;
  const tileCount = shown.length + 1;
  const tileClass =
    "group relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-foreground text-background md:aspect-[4/3]";
  const labelClass = "relative text-center text-base font-light uppercase tracking-[0.22em] md:text-lg";
  const subClass = "relative mt-2 text-[10px] uppercase tracking-[0.2em] text-background/70";

  return (
    <div className={cn("grid grid-cols-2 gap-px", tileCount <= 6 ? "md:grid-cols-3" : "md:grid-cols-4", className)}>
      {shown.map((name) => {
        const cover = coverFor(name);
        return (
          <Link key={name} to={`/products?category=${encodeURIComponent(name)}`} className={tileClass}>
            {cover ? (
              <img
                src={cover}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : null}
            <span className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/55" aria-hidden />
            <span className="relative flex flex-col items-center px-4">
              <span className={labelClass}>{name}</span>
              <span className={subClass}>{t("landing.categories.view")}</span>
            </span>
          </Link>
        );
      })}
      <Link to="/products" className={tileClass}>
        <span className="relative flex flex-col items-center px-4">
          <span className={labelClass}>{t("landing.categories.all")}</span>
          <span className={subClass}>{t("landing.categories.view")}</span>
        </span>
      </Link>
    </div>
  );
}
