import { useId, useMemo, useState } from "react";
import { Label } from "../ui/label";
import { cn } from "../ui/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import {
  type CurrentExchangeRates,
  type QuoteCurrency,
  QUOTE_CURRENCIES,
  buildRateMap,
  formatCrossRateLine,
  normalizeBaseAmount,
  otherCurrencies,
} from "../../utils/exchange";

type ExchangePanelProps = {
  /** Current rates, or null while loading / unavailable. */
  ratesData: CurrentExchangeRates | null;
  className?: string;
  id?: string;
};

/**
 * Exchange-rate panel on a soft surface: today's RUB→KRW rate set large,
 * plus a converter across all quote currencies. Used on the dashboard and the landing page.
 */
export function ExchangePanel({ ratesData, className, id }: ExchangePanelProps) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const [baseCurrency, setBaseCurrency] = useState<QuoteCurrency>("RUB");
  const [baseAmountInput, setBaseAmountInput] = useState("1");

  const rateMap = useMemo(() => buildRateMap(ratesData?.quotes), [ratesData]);
  const hasRates = Boolean(ratesData && ratesData.quotes.length > 0);
  const baseAmount = useMemo(() => normalizeBaseAmount(baseAmountInput), [baseAmountInput]);

  const currencyLabel = (c: QuoteCurrency) => t(`home.exchange.currencies.${c}`);

  const krwRubSummary = hasRates
    ? formatCrossRateLine("RUB", "KRW", rateMap, locale, 1) ?? t("home.exchange.rateUnavailable")
    : null;

  /** "1 RUB = 15.42 KRW" → ["1 RUB", "15.42 KRW"] so the converted side can be set large. */
  const [headlineBase, headlineValue] = useMemo(() => {
    if (!krwRubSummary) return [null, null] as const;
    const idx = krwRubSummary.indexOf(" = ");
    if (idx < 0) return [null, krwRubSummary] as const;
    return [krwRubSummary.slice(0, idx), krwRubSummary.slice(idx + 3)] as const;
  }, [krwRubSummary]);

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-24 rounded-3xl bg-muted p-6 md:p-8", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={headingId} className="text-xl font-bold tracking-[-0.02em]">
          {t("home.exchange.title")}
        </h2>
        {ratesData?.fetchedAt ? (
          <span className="shrink-0 pt-1 text-xs text-muted-foreground figure">
            {formatDate(ratesData.fetchedAt, locale)} {t("home.exchange.asOf")}
          </span>
        ) : null}
      </div>

      {hasRates ? (
        <>
          <div className="mt-6">
            {headlineBase ? <p className="text-sm text-muted-foreground figure">{headlineBase}</p> : null}
            <p className="mt-1 text-4xl font-bold leading-none tracking-[-0.03em] figure md:text-5xl">{headlineValue}</p>
          </div>

          <div className="mt-8">
            <p className="text-xs text-muted-foreground">{t("home.exchange.baseCurrency")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("home.exchange.baseCurrency")}>
              {QUOTE_CURRENCIES.map((c) => {
                const active = baseCurrency === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setBaseCurrency(c)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      active ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Label htmlFor={`${headingId}-amount`} className="text-xs font-normal text-muted-foreground">
                {t("home.exchange.baseAmount")}
              </Label>
              <input
                id={`${headingId}-amount`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="mt-1 w-full border-b border-foreground/20 bg-transparent py-1 text-2xl font-semibold text-foreground outline-none figure transition-colors placeholder:text-muted-foreground focus:border-brand"
                value={baseAmountInput}
                onChange={(e) => setBaseAmountInput(e.target.value)}
                onBlur={() => {
                  const normalized = normalizeBaseAmount(baseAmountInput);
                  setBaseAmountInput(String(normalized));
                }}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("home.exchange.baseAmountHint").replace("{{currency}}", baseCurrency)}
              </p>
            </div>

            <ul className="mt-5 border-t border-foreground/10">
              {otherCurrencies(baseCurrency).map((target) => {
                const line = formatCrossRateLine(baseCurrency, target, rateMap, locale, baseAmount);
                return (
                  <li
                    key={target}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-foreground/10 py-2.5"
                  >
                    <span className="text-sm text-muted-foreground">{currencyLabel(target)}</span>
                    <span className="text-base font-medium figure">{line ?? t("home.exchange.rateUnavailable")}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">{t("home.exchange.autoUpdate")}</p>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">{t("home.exchange.loading")}</p>
      )}
    </section>
  );
}
