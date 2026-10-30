import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import { useTranslation } from "../../hooks/useTranslation";
import { clearRecentSearches, readRecentSearches, rememberSearch } from "../../utils/recentProducts";

type SearchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Search drops from the top: one field, the recent terms underneath, results on the catalogue page. */
export function SearchSheet({ open, onOpenChange }: SearchSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecentSearches());
    const handle = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(handle);
  }, [open]);

  const go = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    rememberSearch(clean);
    setTerm("");
    onOpenChange(false);
    navigate(`/products?keyword=${encodeURIComponent(clean)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(term);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="gap-0 p-0">
        <SheetTitle className="sr-only">{t("search.title")}</SheetTitle>
        <SheetDescription className="sr-only">{t("search.hint")}</SheetDescription>
        <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-14 md:px-6 md:pt-20">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-foreground pb-3">
            <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.25} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.title")}
              className="h-12 w-full min-w-0 bg-transparent text-xl font-light tracking-[0.02em] outline-none placeholder:text-muted-foreground md:text-2xl [&::-webkit-search-cancel-button]:hidden"
            />
            {term ? (
              <button type="button" onClick={() => setTerm("")} aria-label={t("common.clear")} className="text-muted-foreground transition-colors hover:text-foreground">
                <X className="size-4" strokeWidth={1.5} aria-hidden />
              </button>
            ) : null}
          </form>

          {recent.length > 0 ? (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-muted-foreground">{t("search.recent")}</p>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                  className="text-[11px] tracking-[0.12em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  {t("common.clear")}
                </button>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => go(r)}
                      className="border border-border px-3 py-1.5 text-sm transition-colors hover:border-foreground"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{t("search.hint")}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
