import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type FormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Group of related fields. On desktop the title sits in a narrow left column
 * and the fields in the wide right column; sections are separated by hairlines.
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div
      className={cn(
        "grid gap-5 border-t border-border py-8 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-medium">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </div>
  );
}

type FormActionsProps = {
  children: ReactNode;
  /** `between` puts the first child on the left (e.g. a back button). */
  align?: "end" | "between";
  className?: string;
};

/** Row of submit/cancel buttons at the end of a form. */
export function FormActions({ children, align = "end", className }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-border pt-6",
        align === "end" ? "justify-end" : "justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

type FieldProps = {
  /** Should match the control's `id`. */
  htmlFor?: string;
  label: ReactNode;
  /** Helper text under the control. */
  hint?: ReactNode;
  /** Validation message; replaces the hint and turns red. */
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error, stacked. Wrap any Input/Select/Textarea. */
export function Field({ htmlFor, label, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
