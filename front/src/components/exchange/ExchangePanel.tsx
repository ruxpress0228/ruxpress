import { useId, useMemo, useState } from "react";
import { Label } from "../ui/label";
import { cn } from "../ui/utils";
import { Section } from "../page";
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
};

/**
 * The black exchange-rate panel: today's RUB→KRW rate set large, plus a
 * converter across all quote currencies. Used on the dashboard and the landing page.
 */
export function ExchangePanel({ ratesData, className }: ExchangePanelProps) {
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
    <Section
      id={headingId}
      title={t("home.exchange.title")}
      tone="inverted"
      flush
      className={cn("bg-foreground p-5 text-background md:p-7", className)}
      action={
        ratesData?.fetchedAt ? (
          <span className="text-background/60 figure">
            {formatDate(ratesData.fetchedAt, locale)} {t("home.exchange.asOf")}
          </span>
        ) : null
      }
    >
      {hasRates ? (
        <>
          <div className="mt-7">
            {headlineBase ? <p className="text-sm text-background/60 figure">{headlineBase}</p> : null}
            <p className="mt-1 text-4xl font-light leading-none figure md:text-5xl">{headlineValue}</p>
          </div>

          <div className="mt-8">
            <p className="text-xs text-background/60">{t("home.exchange.baseCurrency")}</p>
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
                      "border px-2.5 py-1 text-xs tracking-[0.08em] transition-colors",
                      active
                        ? "border-background bg-background text-foreground"
                        : "border-background/30 text-background/80 hover:border-background",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Label htmlFor={`${headingId}-amount`} className="text-xs font-normal text-background/60">
                {t("home.exchange.baseAmount")}
              </Label>
              <input
                id={`${headingId}-amount`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="mt-1 w-full border-b border-background/40 bg-transparent py-1 text-2xl font-light text-background outline-none figure transition-colors placeholder:text-background/40 focus:border-background"
                value={baseAmountInput}
                onChange={(e) => setBaseAmountInput(e.target.value)}
                onBlur={() => {
                  const normalized = normalizeBaseAmount(baseAmountInput);
                  setBaseAmountInput(String(normalized));
                }}
              />
              <p className="mt-2 text-[11px] text-background/50">
                {t("home.exchange.baseAmountHint").replace("{{currency}}", baseCurrency)}
              </p>
            </div>

            <ul className="mt-5 border-t border-background/20">
              {otherCurrencies(baseCurrency).map((target) => {
                const line = formatCrossRateLine(baseCurrency, target, rateMap, locale, baseAmount);
                return (
                  <li
                    key={target}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-background/20 py-2.5"
                  >
                    <span className="text-sm text-background/60">{currencyLabel(target)}</span>
                    <span className="text-base figure">{line ?? t("home.exchange.rateUnavailable")}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-background/50">{t("home.exchange.autoUpdate")}</p>
          </div>
        </>
      ) : (
        <p className="mt-7 text-sm text-background/60">{t("home.exchange.loading")}</p>
      )}
    </Section>
  );
}
