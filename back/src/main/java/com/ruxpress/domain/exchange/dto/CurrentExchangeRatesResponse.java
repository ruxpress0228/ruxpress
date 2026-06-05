package com.ruxpress.domain.exchange.dto;

import com.ruxpress.domain.exchange.entity.ExchangeRate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrentExchangeRatesResponse {

    private LocalDateTime fetchedAt;
    private List<QuoteRateResponse> quotes;

    public static CurrentExchangeRatesResponse from(List<ExchangeRate> currents) {
        List<QuoteRateResponse> quotes = currents.stream()
                .map(QuoteRateResponse::from)
                .toList();
        LocalDateTime latest = currents.stream()
                .map(ExchangeRate::getFetchedAt)
                .max(Comparator.naturalOrder())
                .orElse(null);
        return CurrentExchangeRatesResponse.builder()
                .fetchedAt(latest)
                .quotes(quotes)
                .build();
    }
}
