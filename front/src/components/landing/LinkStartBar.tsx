import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Link2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useAuthGate } from "../auth/AuthGate";
import { useTranslation } from "../../hooks/useTranslation";

type LinkStartBarProps = {
  /** `onDark` sets the bar on the blue hero; `onLight` on a white or muted surface. */
  tone?: "onDark" | "onLight";
  className?: string;
};

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value);
}

/**
 * The service in one control: paste a Korean shop link, start a request.
 * Guests get the login sheet and land on the prefilled form afterwards.
 */
export function LinkStartBar({ tone = "onDark", className }: LinkStartBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, requireLogin } = useAuthGate();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const url = value.trim();
    if (url && !looksLikeUrl(url)) {
      setInvalid(true);
      return;
    }
    const target = url ? `/purchase/new?url=${encodeURIComponent(url)}` : "/purchase/new";
    if (isLoggedIn || requireLogin(target)) {
      navigate(target);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-3xl bg-background p-2 sm:flex-row sm:items-center sm:rounded-full sm:pl-5",
          tone === "onLight" && "border border-border",
          invalid && "ring-2 ring-destructive",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          {t("landing.link.label")}
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-0">
          <Link2 className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          <input
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={t("landing.link.placeholder")}
            value={value}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setValue(e.target.value);
              if (invalid) setInvalid(false);
            }}
            className="h-11 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {t("landing.link.cta")}
        </Button>
      </div>
      <p
        role="status"
        className={cn(
          "mt-2 min-h-5 px-2 text-sm",
          invalid ? "visible" : "invisible",
          tone === "onDark" ? "text-brand-foreground/90" : "text-destructive",
        )}
      >
        {t("landing.link.hint")}
      </p>
    </form>
  );
}
