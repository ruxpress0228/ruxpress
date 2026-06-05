package com.ruxpress.domain.exchange.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * KRW 허브 교차 환율: rateToKrw(X) = 1 X 당 KRW. KRW는 1.
 */
public final class ExchangeRateMath {

    private static final int RATE_SCALE = 6;
    private static final int DISPLAY_SCALE = 6;

    private ExchangeRateMath() {
    }

    public static BigDecimal rateToKrw(String currency, Map<String, BigDecimal> rateMap) {
        if ("KRW".equalsIgnoreCase(currency)) {
            return BigDecimal.ONE;
        }
        BigDecimal rate = rateMap.get(currency.toUpperCase());
        return rate != null && rate.compareTo(BigDecimal.ZERO) > 0 ? rate : null;
    }

    /**
     * 1 unit of {@code fromCurrency} expressed in {@code toCurrency}.
     */
    public static BigDecimal crossRate(String fromCurrency, String toCurrency, Map<String, BigDecimal> rateMap) {
        BigDecimal from = rateToKrw(fromCurrency, rateMap);
        BigDecimal to = rateToKrw(toCurrency, rateMap);
        if (from == null || to == null) {
            return null;
        }
        return from.divide(to, DISPLAY_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal krwToQuote(BigDecimal amountKrw, String quoteCurrency, Map<String, BigDecimal> rateMap) {
        if (amountKrw == null) {
            return null;
        }
        BigDecimal rate = rateToKrw(quoteCurrency, rateMap);
        if (rate == null) {
            return null;
        }
        return amountKrw.divide(rate, 2, RoundingMode.HALF_UP);
    }
}
