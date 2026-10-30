import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Usually one outline button that starts the missing thing. */
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

/** Empty list or missing data. Says what is missing and what to do next. */
export function EmptyState({ icon: Icon, title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 border border-border px-6 text-center",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      {Icon ? <Icon className="size-6 text-muted-foreground" strokeWidth={1.25} aria-hidden /> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Loading placeholder with the same footprint as EmptyState. */
export function LoadingState({ label, compact = false, className }: { label: ReactNode; compact?: boolean; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center border border-border px-6 text-sm text-muted-foreground",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      {label}
    </div>
  );
}
