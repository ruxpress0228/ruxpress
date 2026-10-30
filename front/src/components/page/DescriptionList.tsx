import type { ReactNode } from "react";
import { cn } from "../ui/utils";

export type DescriptionItem = {
  key?: string;
  label: ReactNode;
  value: ReactNode;
  /** Take the full width in a two-column list. */
  span?: boolean;
};

type DescriptionListProps = {
  items: DescriptionItem[];
  columns?: 1 | 2;
  /** Tighter rows for sidebars and dialogs. */
  dense?: boolean;
  className?: string;
};

/** Key/value rows separated by hairlines. Use for detail pages, receipts and summaries. */
export function DescriptionList({ items, columns = 1, dense = false, className }: DescriptionListProps) {
  return (
    <dl className={cn("grid border-t border-border", columns === 2 && "md:grid-cols-2 md:gap-x-10", className)}>
      {items.map((item, i) => (
        <div
          key={item.key ?? i}
          className={cn(
            "grid grid-cols-[minmax(6.5rem,9rem)_minmax(0,1fr)] gap-4 border-b border-border text-sm",
            dense ? "py-2" : "py-3",
            item.span && columns === 2 && "md:col-span-2",
          )}
        >
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
