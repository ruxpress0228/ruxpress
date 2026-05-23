package com.ruxpress.domain.exchange.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ExchangeRateMathTest {

    @Test
    void rateToKrw_krwIsOne() {
        assertThat(ExchangeRateMath.rateToKrw("KRW", Map.of())).isEqualByComparingTo(BigDecimal.ONE);
    }

    @Test
    void crossRate_computesFromKrwHub() {
        Map<String, BigDecimal> map = Map.of(
                "RUB", new BigDecimal("15"),
                "USD", new BigDecimal("1350")
        );
        // 1 RUB = 15/1350 USD
        BigDecimal rubToUsd = ExchangeRateMath.crossRate("RUB", "USD", map);
        assertThat(rubToUsd).isNotNull();
        assertThat(rubToUsd.doubleValue()).isCloseTo(15.0 / 1350.0, org.assertj.core.data.Offset.offset(0.0001));

        // 1 USD = 1350/15 RUB
        BigDecimal usdToRub = ExchangeRateMath.crossRate("USD", "RUB", map);
        assertThat(usdToRub).isNotNull();
        assertThat(usdToRub.doubleValue()).isCloseTo(90.0, org.assertj.core.data.Offset.offset(0.01));
    }

    @Test
    void krwToQuote_dividesByRateToKrw() {
        Map<String, BigDecimal> map = Map.of("RUB", new BigDecimal("10"));
        BigDecimal quote = ExchangeRateMath.krwToQuote(new BigDecimal("1000"), "RUB", map);
        assertThat(quote).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void crossRate_returnsNullWhenRateMissing() {
        assertThat(ExchangeRateMath.crossRate("CNY", "USD", Map.of("USD", new BigDecimal("1300")))).isNull();
    }
}
