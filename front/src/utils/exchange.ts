/** KRW 허브 + 외화 시세 */
export type QuoteCurrency = "KRW" | "RUB" | "USD" | "CNY";

export const QUOTE_CURRENCIES: QuoteCurrency[] = ["KRW", "RUB", "USD", "CNY"];

export const FOREIGN_QUOTE_CURRENCIES: Exclude<QuoteCurrency, "KRW">[] = ["RUB", "USD", "CNY"];

export interface QuoteRate {
  currency: string;
  rateToKrw: number;
  id: number;
  source: "API" | "MANUAL";
  fetchedAt: string;
}

export interface CurrentExchangeRates {
  fetchedAt: string | null;
  quotes: QuoteRate[];
}

export function buildRateMap(quotes: QuoteRate[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const q of quotes) {
    if (q.rateToKrw > 0) {
      map.set(q.currency.toUpperCase(), q.rateToKrw);
    }
  }
  return map;
}

export function rateToKrw(currency: QuoteCurrency, rateMap: Map<string, number>): number | null {
  if (currency === "KRW") return 1;
  const r = rateMap.get(currency);
  return r != null && r > 0 ? r : null;
}

/** 1 unit of fromCurrency in toCurrency */
export function crossRate(
  fromCurrency: QuoteCurrency,
  toCurrency: QuoteCurrency,
  rateMap: Map<string, number>
): number | null {
  const from = rateToKrw(fromCurrency, rateMap);
  const to = rateToKrw(toCurrency, rateMap);
  if (from == null || to == null) return null;
  return from / to;
}

export function formatCrossRateLine(
  base: QuoteCurrency,
  target: QuoteCurrency,
  rateMap: Map<string, number>,
  locale: string,
  baseAmount = 1,
  decimals = 6
): string | null {
  const unitRate = crossRate(base, target, rateMap);
  if (unitRate == null || baseAmount <= 0) return null;
  const converted = unitRate * baseAmount;
  const localeTag = locale === "en" ? "en-US" : "ko-KR";
  const baseOpts = {
    minimumFractionDigits: Number.isInteger(baseAmount) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(baseAmount) ? 0 : 4,
  };
  const targetOpts = { minimumFractionDigits: 2, maximumFractionDigits: decimals };
  const formattedBase = baseAmount.toLocaleString(localeTag, baseOpts);
  const formattedTarget = converted.toLocaleString(localeTag, targetOpts);
  return `${formattedBase} ${base} = ${formattedTarget} ${target}`;
}

export function normalizeBaseAmount(raw: string): number {
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

export function krwToQuote(amountKrw: number, quote: Exclude<QuoteCurrency, "KRW">, rateMap: Map<string, number>): number | null {
  const r = rateToKrw(quote, rateMap);
  if (r == null) return null;
  return Math.round((amountKrw / r) * 100) / 100;
}

export function findQuoteRate(quotes: QuoteRate[], currency: string): QuoteRate | undefined {
  return quotes.find((q) => q.currency.toUpperCase() === currency.toUpperCase());
}

export function otherCurrencies(base: QuoteCurrency): QuoteCurrency[] {
  return QUOTE_CURRENCIES.filter((c) => c !== base);
}

/** 1 KRW = ? foreign (관리자 KRW 기준 입력·표시용) */
export function krwPerOneToForeign(rateToKrw: number): number | null {
  if (!Number.isFinite(rateToKrw) || rateToKrw <= 0) return null;
  return 1 / rateToKrw;
}

/** 관리자 입력(1 KRW = x foreign) → 저장용 rateToKrw (1 foreign = ? KRW) */
export function foreignPerKrwToRateToKrw(foreignPerKrw: number): number | null {
  if (!Number.isFinite(foreignPerKrw) || foreignPerKrw <= 0) return null;
  return 1 / foreignPerKrw;
}

export function formatKrwBasisRate(
  currency: string,
  rateToKrw: number,
  locale: string,
  decimals = 6
): string | null {
  const perKrw = krwPerOneToForeign(rateToKrw);
  if (perKrw == null) return null;
  const formatted = perKrw.toLocaleString(locale === "en" ? "en-US" : "ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
  return `1 KRW = ${formatted} ${currency}`;
}
