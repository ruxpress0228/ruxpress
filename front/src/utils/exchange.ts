/** KRW 허브 + 외화 시세 */
export type QuoteCurrency = "KRW" | "RUB" | "USD" | "CNY" | "JPY" | "EUR";

export const QUOTE_CURRENCIES: QuoteCurrency[] = ["KRW", "RUB", "USD", "CNY", "JPY", "EUR"];

export const FOREIGN_QUOTE_CURRENCIES: Exclude<QuoteCurrency, "KRW">[] = [
  "RUB",
  "USD",
  "CNY",
  "JPY",
  "EUR",
];

/** RUB 기준 환율 표시 대상 */
export const RUB_PAIR_TARGETS: Exclude<QuoteCurrency, "RUB">[] = ["KRW", "CNY", "JPY", "USD", "EUR"];

const CURRENCY_SYMBOLS: Partial<Record<QuoteCurrency, string>> = {
  KRW: "₩",
  RUB: "₽",
  USD: "$",
  CNY: "¥",
  JPY: "¥",
  EUR: "€",
};

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

export function buildRateMap(quotes: QuoteRate[] | null | undefined): Map<string, number> {
  const map = new Map<string, number>();
  if (!Array.isArray(quotes)) {
    return map;
  }
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

/** 1 {currency} = ? KRW (관리자 입력·표시) */
export function formatRateToKrwLine(currency: string, rateToKrw: number): string {
  const formatted = formatRateToKrwForInput(rateToKrw);
  return `1 ${currency} = ${formatted} KRW`;
}

/** DB/API rateToKrw → 입력 필드 문자열 (부동소수 오차 제거) */
export function formatRateToKrwForInput(rateToKrw: number): string {
  if (!Number.isFinite(rateToKrw) || rateToKrw <= 0) return "";
  const rounded = Math.round(rateToKrw * 1_000_000) / 1_000_000;
  return rounded.toFixed(6).replace(/\.?0+$/, "");
}

/** 관리자 입력값 파싱 → 저장용 rateToKrw */
export function parseRateToKrwInput(raw: string): number | null {
  const num = parseFloat(raw.trim());
  if (!raw.trim() || !Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 1_000_000) / 1_000_000;
}

export function currencySymbol(currency: QuoteCurrency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function krwToForeignEquivalents(
  krwBalance: number,
  currencies: Exclude<QuoteCurrency, "KRW">[],
  rateMap: Map<string, number>
): { currency: Exclude<QuoteCurrency, "KRW">; amount: number }[] {
  if (!Number.isFinite(krwBalance) || krwBalance < 0) return [];
  const result: { currency: Exclude<QuoteCurrency, "KRW">; amount: number }[] = [];
  for (const c of currencies) {
    const converted = krwToQuote(krwBalance, c, rateMap);
    if (converted != null) {
      result.push({ currency: c, amount: converted });
    }
  }
  return result;
}

export function formatBalanceEquivalents(
  krwBalance: number,
  currencies: Exclude<QuoteCurrency, "KRW">[],
  rateMap: Map<string, number>,
  locale: string
): string | null {
  const parts = krwToForeignEquivalents(krwBalance, currencies, rateMap);
  if (parts.length === 0) return null;
  const localeTag = locale === "en" ? "en-US" : locale === "ru" ? "ru-RU" : "ko-KR";
  const formatted = parts.map(({ currency, amount }) => {
    const sym = currencySymbol(currency);
    const decimals = currency === "JPY" ? 0 : 2;
    const num = amount.toLocaleString(localeTag, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${sym}${num}`;
  });
  return formatted.join(" · ");
}
