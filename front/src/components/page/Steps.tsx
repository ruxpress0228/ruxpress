import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type StepsProps = {
  steps: ReactNode[];
  /** Zero-based index of the current step. */
  current: number;
  className?: string;
};

/** Numbered progress for multi-step flows (sign-up, purchase request). */
export function Steps({ steps, current, className }: StepsProps) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 text-xs", className)}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={i} className="flex items-center gap-3">
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={cn("flex items-center gap-2", state === "todo" ? "text-muted-foreground" : "text-foreground")}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center border text-[10px] font-medium figure",
                  state === "done" && "border-foreground bg-foreground text-background",
                  state === "current" && "border-foreground",
                  state === "todo" && "border-border",
                )}
              >
                {i + 1}
              </span>
              <span className={cn(state === "current" && "font-medium")}>{label}</span>
            </span>
            {i < steps.length - 1 ? <span className="h-px w-6 bg-border" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
