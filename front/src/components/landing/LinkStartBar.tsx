import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useAuthGate } from "../auth/AuthGate";
import { useTranslation } from "../../hooks/useTranslation";

type LinkStartBarProps = {
  /** `onDark` sits on a photo or black panel; `onLight` on the white page. */
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
export function LinkStartBar({ tone = "onLight", className }: LinkStartBarProps) {
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

  const dark = tone === "onDark";

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "flex flex-col gap-2 bg-background p-1.5 sm:flex-row sm:items-center sm:pl-4",
          dark ? "border border-background" : "border border-foreground",
          invalid && "border-destructive",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          {t("landing.link.label")}
        </label>
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
          className="h-10 w-full min-w-0 bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:px-0"
        />
        <Button type="submit" className="w-full sm:w-auto">
          {t("landing.link.cta")}
        </Button>
      </div>
      <p
        role="status"
        className={cn(
          "mt-2 min-h-4 text-xs",
          invalid ? "visible" : "invisible",
          dark ? "text-background/80" : "text-destructive",
        )}
      >
        {t("landing.link.hint")}
      </p>
    </form>
  );
}
