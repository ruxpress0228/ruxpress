import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { cn } from "../ui/utils";
import { useWishlist } from "./WishlistProvider";
import { useTranslation } from "../../hooks/useTranslation";

type WishButtonProps = {
  productId: number;
  /** `overlay` sits on a photo; `inline` next to a title; `labelled` is the full button on the product page. */
  variant?: "overlay" | "inline" | "labelled";
  className?: string;
};

/** The heart. Filled when the product is on the member's wishlist. */
export function WishButton({ productId, variant = "overlay", className }: WishButtonProps) {
  const { t } = useTranslation();
  const { isWished, toggle } = useWishlist();
  const wished = isWished(productId);
  const label = wished ? t("wishlist.remove") : t("wishlist.add");

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Cards are links; the heart must not follow them.
    e.preventDefault();
    e.stopPropagation();
    void toggle(productId);
  };

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={wished}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 border border-foreground/30 text-xs font-medium uppercase tracking-[0.12em] transition-colors hover:border-foreground",
          className,
        )}
      >
        <Heart className={cn("size-4", wished && "fill-current")} strokeWidth={1.5} aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={wished}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center transition-colors",
        variant === "overlay" &&
          "size-9 bg-background/85 text-foreground backdrop-blur-sm hover:bg-background",
        variant === "inline" && "size-9 text-foreground hover:text-muted-foreground",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", wished && "fill-current")} strokeWidth={1.5} aria-hidden />
    </button>
  );
}
