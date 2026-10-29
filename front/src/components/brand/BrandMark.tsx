import { cn } from "../ui/utils";

const BRAND_NAME = "Main Proxy";

type WordmarkProps = {
  className?: string;
  /** Visual size of the wordmark. */
  size?: "sm" | "md" | "lg";
};

const WORDMARK_SIZE: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[12px] tracking-[0.22em]",
  md: "text-[14px] tracking-[0.24em]",
  lg: "text-[18px] tracking-[0.26em]",
};

/** Letter-spaced uppercase wordmark used in the header, footer and auth pages. */
export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap font-medium uppercase leading-none text-foreground",
        WORDMARK_SIZE[size],
        className,
      )}
    >
      {BRAND_NAME}
    </span>
  );
}

type MarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const MARK_SIZE: Record<NonNullable<MarkProps["size"]>, string> = {
  sm: "size-7 text-[9px] tracking-[0.12em]",
  md: "size-10 text-[11px] tracking-[0.14em]",
  lg: "size-12 text-[13px] tracking-[0.16em]",
};

/** Square monogram used where a compact brand symbol is needed. */
export function Mark({ className, size = "md" }: MarkProps) {
  return (
    <span
      aria-label={BRAND_NAME}
      role="img"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center bg-foreground font-semibold uppercase leading-none text-background",
        MARK_SIZE[size],
        className,
      )}
    >
      MP
    </span>
  );
}
