import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "../ui/utils";

type PageHeaderProps = {
  title: ReactNode;
  /** One sentence under the title. Keep it short. */
  description?: ReactNode;
  /** Buttons or links aligned to the right on desktop. */
  actions?: ReactNode;
  /** Optional link rendered above the title, usually back to the list. */
  back?: { to: string; label: ReactNode };
  /** Small line under the description: badges, dates, identifiers. */
  meta?: ReactNode;
  /** `center` for the public store pages (catalogue, notices, auth). */
  align?: "start" | "center";
  className?: string;
};

/** Standard page opening: light large title, muted description, actions on the right. */
export function PageHeader({ title, description, actions, back, meta, align = "start", className }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn("mb-8 md:mb-10", align === "center" && "text-center", className)}>
      {back ? (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden />
          {back.label}
        </Link>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-5",
          align === "center" ? "items-center" : "md:flex-row md:items-end md:justify-between",
        )}
      >
        <div className="min-w-0">
          <h1 data-slot="page-title" className="page-title">{title}</h1>
          {description ? (
            <p
              data-slot="page-description"
              className={cn("mt-2 max-w-2xl text-sm text-muted-foreground md:text-base", align === "center" && "mx-auto")}
            >
              {description}
            </p>
          ) : null}
          {meta ? (
            <div
              className={cn(
                "mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
                align === "center" && "justify-center",
              )}
            >
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
