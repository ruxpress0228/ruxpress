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
  className = "text-sm font-medium text-blue-700/90 mt-1",
}: Props) {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const [rateMap, setRateMap] = useState(() => new Map<string, number>());
  const [ratesStatus, setRatesStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    setRatesStatus("loading");
    getCurrentExchangeRates()
      .then((data) => {
        setRateMap(buildRateMap(data.quotes));
        setRatesStatus("ok");
      })
      .catch(() => {
        setRateMap(new Map());
        setRatesStatus("error");
      });
  }, [getCurrentExchangeRates]);

  const equivalents = useMemo(() => {
    if (balance == null || balance < 0) return null;
    return formatBalanceEquivalents(balance, FOREIGN_QUOTE_CURRENCIES, rateMap, locale);
  }, [balance, rateMap, locale]);

  if (balance == null) return null;

  if (ratesStatus === "loading") {
    return (
      <p className={className} aria-busy="true">
        {t("balanceEquivalents.loading")}
      </p>
    );
  }

  if (ratesStatus === "error") {
    return (
      <p className={`${className} text-amber-700`} title={t(hintKey)}>
        {t("balanceEquivalents.unavailable")}
      </p>
    );
  }

  if (!equivalents) {
    return (
      <p className={`${className} text-gray-500`} title={t(hintKey)}>
        {t("balanceEquivalents.noRates")}
      </p>
    );
  }

  return (
    <p className={className} title={t(hintKey)}>
      ≈ {equivalents}
    </p>
  );
}
