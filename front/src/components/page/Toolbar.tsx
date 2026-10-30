import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type ToolbarProps = {
  /** Search box and primary filters. */
  children: ReactNode;
  /** Secondary controls aligned right (sort, page size). */
  trailing?: ReactNode;
  className?: string;
};

/** Filter row above a list or table. Stacks on mobile, one row on desktop. */
export function Toolbar({ children, trailing, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">{children}</div>
      {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

type PagerProps = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: ReactNode;
  nextLabel: ReactNode;
  /** Optional page-size control rendered on the left. */
  leading?: ReactNode;
  className?: string;
};

/** Previous / "1 / 5" / Next pager used under lists and tables. */
export function Pager({ page, totalPages, onPrev, onNext, prevLabel, nextLabel, leading, className }: PagerProps) {
  const safeTotal = Math.max(totalPages, 1);
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 pt-4", className)}>
      <div className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">{leading}</div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 0}
          className="h-9 shrink-0 whitespace-nowrap border border-border px-3 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          {prevLabel}
        </button>
        <span className="min-w-[4rem] shrink-0 whitespace-nowrap px-2 text-center text-sm figure">
          {page + 1} / {safeTotal}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page + 1 >= safeTotal}
          className="h-9 shrink-0 whitespace-nowrap border border-border px-3 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
