import type { ExchangeRate } from "../../types";
import { api } from "../../utils/api";

const EXCHANGE_BASE = "/v1/exchange-rates";

export function useExchangeRate() {
  const getCurrentExchangeRate = (): Promise<ExchangeRate> => {
    return api.get<ExchangeRate>(`${EXCHANGE_BASE}/current`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to load exchange rate");
      }
      return res.data;
    });
  };

  const getExchangeRateHistory = (
    page = 0,
    size = 20
  ): Promise<{
    content: ExchangeRate[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> => {
    return api
      .get<{
        content: ExchangeRate[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      }>(`${EXCHANGE_BASE}?page=${page}&size=${size}`)
      .then((res) => {
        if (res.code !== 200 || res.data == null) {
          throw new Error(res.message || "Failed to load exchange rate history");
        }
        return res.data;
      });
  };

  const triggerExchangeRateFetch = (): Promise<ExchangeRate> => {
    return api.post<ExchangeRate>(`${EXCHANGE_BASE}/fetch`).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to fetch exchange rate");
      }
      return res.data;
    });
  };

  const setManualExchangeRate = (rate: number): Promise<ExchangeRate> => {
    return api.post<ExchangeRate>(`${EXCHANGE_BASE}/manual`, { rate }).then((res) => {
      if (res.code !== 200 || res.data == null) {
        throw new Error(res.message || "Failed to set manual exchange rate");
      }
      return res.data;
    });
  };

  return {
    getCurrentExchangeRate,
    getExchangeRateHistory,
    triggerExchangeRateFetch,
    setManualExchangeRate,
  };
}
