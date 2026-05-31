import { useCallback } from "react";
import type { CurrentExchangeRates } from "../../utils/exchange";
import type { ExchangeRate } from "../../types";
import { api } from "../../utils/api";
import { DEFAULT_PAGE_SIZE } from "../../utils/constants";

const EXCHANGE_BASE = "/v1/exchange-rates";

export function useExchangeRate() {
  const getCurrentExchangeRates = useCallback((): Promise<CurrentExchangeRates> => {
    return api.get<CurrentExchangeRates>(`${EXCHANGE_BASE}/current`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to load exchange rates");
      }
      return res.data;
    });
  }, []);

  /** @deprecated use getCurrentExchangeRates */
  const getCurrentExchangeRate = useCallback(async (): Promise<ExchangeRate> => {
    const data = await getCurrentExchangeRates();
    const rub = data.quotes.find((q) => q.currency === "RUB");
    if (!rub) {
      throw new Error("RUB exchange rate not found");
    }
    return {
      id: rub.id,
      baseCurrency: "RUB",
      targetCurrency: "KRW",
      rate: rub.rateToKrw,
      source: rub.source,
      isCurrent: true,
      fetchedAt: rub.fetchedAt,
      createdAt: rub.fetchedAt,
    };
  }, [getCurrentExchangeRates]);

  const getExchangeRateHistory = useCallback(
    (
      page = 0,
      size = DEFAULT_PAGE_SIZE,
      baseCurrency?: string,
    ): Promise<{
      content: ExchangeRate[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }> => {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      if (baseCurrency) {
        params.set("baseCurrency", baseCurrency);
      }
      return api
        .get<{
          content: ExchangeRate[];
          totalElements: number;
          totalPages: number;
          number: number;
          size: number;
        }>(`${EXCHANGE_BASE}?${params.toString()}`)
        .then((res) => {
          if (res.code !== 200 || res.data == null) {
            throw new Error(res.message || "Failed to load exchange rate history");
          }
          return res.data;
        });
    },
    [],
  );

  const triggerExchangeRateFetch = useCallback((): Promise<CurrentExchangeRates> => {
    return api.post<CurrentExchangeRates>(`${EXCHANGE_BASE}/fetch`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch exchange rate");
      }
      return res.data;
    });
  }, []);

  const setManualExchangeRate = useCallback((currency: string, rate: number): Promise<CurrentExchangeRates> => {
    return api.post<CurrentExchangeRates>(`${EXCHANGE_BASE}/manual`, { currency, rate }).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to set manual exchange rate");
      }
      return res.data;
    });
  }, []);

  return {
    getCurrentExchangeRates,
    getCurrentExchangeRate,
    getExchangeRateHistory,
    triggerExchangeRateFetch,
    setManualExchangeRate,
  };
}
