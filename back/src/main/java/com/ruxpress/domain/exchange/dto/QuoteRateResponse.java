package com.ruxpress.domain.exchange.dto;

import com.ruxpress.domain.exchange.entity.ExchangeRate;
import com.ruxpress.domain.exchange.entity.ExchangeRateSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteRateResponse {

    private String currency;
    private BigDecimal rateToKrw;
    private Long id;
    private ExchangeRateSource source;
    private LocalDateTime fetchedAt;

    public static QuoteRateResponse from(ExchangeRate entity) {
        return QuoteRateResponse.builder()
                .currency(entity.getBaseCurrency())
                .rateToKrw(entity.getRate())
                .id(entity.getId())
                .source(entity.getSource())
                .fetchedAt(entity.getFetchedAt())
                .build();
    }
}
