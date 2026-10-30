import type { ReactNode } from "react";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";

export type StatItem = {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** One short line under the value. */
  hint?: ReactNode;
  icon?: LucideIcon;
  /** Navigates when set. */
  to?: string;
  /** Acts as a toggle/filter when set. */
  onClick?: () => void;
  /** Filled black when true (selected filter). */
  active?: boolean;
  /** Small dot marker for the one item that deserves attention. */
  emphasis?: boolean;
};

type StatStripProps = {
  items: StatItem[];
  /** Desktop column count. Mobile always uses 2 (3 for 5+ columns on small screens). */
  columns?: 2 | 3 | 4 | 5 | 6 | 7;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const COLS: Record<NonNullable<StatStripProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-6",
  7: "grid-cols-2 sm:grid-cols-4 md:grid-cols-7",
};

const VALUE: Record<NonNullable<StatStripProps["size"]>, string> = {
  sm: "mt-2 text-2xl",
  md: "mt-4 text-3xl md:text-4xl",
  lg: "mt-5 text-4xl md:text-5xl",
};

const PAD: Record<NonNullable<StatStripProps["size"]>, string> = {
  sm: "p-3 md:p-4",
  md: "p-4 md:p-5",
  lg: "p-4 md:p-5",
};

/** Numbers in a grid that shares one hairline between cells. */
export function StatStrip({ items, columns = 4, size = "md", className }: StatStripProps) {
  return (
    <div
      className={cn(
        "grid border-l border-t border-border",
        // On the 2-column phone layout an odd last cell stretches across both columns.
        "max-sm:[&>*:nth-child(odd):last-child]:col-span-2",
        COLS[columns],
        className,
      )}
    >
      {items.map(({ key, label, value, hint, icon: Icon, to, onClick, active, emphasis }) => {
        const interactive = Boolean(to || onClick);
        const cellClass = cn(
          "block min-w-0 border-b border-r border-border text-left",
          PAD[size],
          interactive && "transition-colors",
          interactive && !active && "hover:bg-muted/60",
          active && "bg-foreground text-background",
        );
        const body = (
          <>
            <div className="flex items-center gap-2 text-sm">
              {Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> : null}
              <span className={cn("min-w-0 truncate font-medium", size === "sm" && "text-xs")}>{label}</span>
              {emphasis ? (
                <span
                  className={cn("ml-auto size-1.5 shrink-0 rounded-full", active ? "bg-background" : "bg-foreground")}
                  aria-hidden
                />
              ) : null}
            </div>
            <p className={cn("font-light figure", VALUE[size])}>{value}</p>
            {hint ? (
              <p className={cn("mt-2 text-xs leading-snug", active ? "text-background/70" : "text-muted-foreground")}>
                {hint}
              </p>
            ) : null}
          </>
        );
        if (to) {
          return (
            <Link key={key} to={to} className={cellClass}>
              {body}
            </Link>
          );
        }
        if (onClick) {
          return (
            <button key={key} type="button" onClick={onClick} aria-pressed={active} className={cellClass}>
              {body}
            </button>
          );
        }
        return (
          <div key={key} className={cellClass}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
