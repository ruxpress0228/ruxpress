import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "../ui/utils";

type SectionProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Small link or button on the right of the heading row. */
  action?: ReactNode;
  children: ReactNode;
  /** `inverted` for use on a black panel (`bg-foreground text-background`). */
  tone?: "default" | "inverted";
  /** Remove the top padding so list rows start right under the rule. */
  flush?: boolean;
  id?: string;
  className?: string;
};

/** Content block with a bold heading, an optional one-line description and a hairline rule. */
export function Section({
  title,
  description,
  action,
  children,
  tone = "default",
  flush = false,
  id,
  className,
}: SectionProps) {
  const inverted = tone === "inverted";
  return (
    <section aria-labelledby={id} className={className}>
      <div
        className={cn(
          "flex items-end justify-between gap-4 border-b pb-3",
          inverted ? "border-background/30" : "border-border",
        )}
      >
        <div className="min-w-0">
          <h2 id={id} className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className={cn("mt-1 text-sm", inverted ? "text-background/60" : "text-muted-foreground")}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pb-1 text-sm">{action}</div> : null}
      </div>
      <div className={flush ? undefined : "pt-4"}>{children}</div>
    </section>
  );
}

type SectionLinkProps = {
  children: ReactNode;
  className?: string;
  to?: string;
  onClick?: () => void;
};

/** Quiet text link for a Section's `action` slot ("View all", "Edit"). */
export function SectionLink({ children, className, to, onClick }: SectionLinkProps) {
  const classes = cn(
    "text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
    className,
  );
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
