import { useEffect, useMemo, useState } from "react";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { useTranslation } from "../../hooks/useTranslation";
import {
  buildRateMap,
  formatBalanceEquivalents,
  FOREIGN_QUOTE_CURRENCIES,
} from "../../utils/exchange";

type Props = {
  balance: number | null;
  hintKey?: string;
  className?: string;
};

export function BalanceEquivalents({
  balance,
  hintKey = "myPage.balanceEquivalentsHint",
  className = "text-xs text-gray-500 mt-0.5",
}: Props) {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [rateMap, setRateMap] = useState(() => new Map<string, number>());

  useEffect(() => {
    getCurrentExchangeRates()
      .then((data) => setRateMap(buildRateMap(data.quotes)))
      .catch(() => setRateMap(new Map()));
  }, [getCurrentExchangeRates]);

  const equivalents = useMemo(() => {
    if (balance == null || balance <= 0) return null;
    return formatBalanceEquivalents(balance, FOREIGN_QUOTE_CURRENCIES, rateMap, locale);
  }, [balance, rateMap, locale]);

  if (!equivalents) return null;

  return (
    <p className={className} title={t(hintKey)}>
      ≈ {equivalents}
    </p>
  );
}
