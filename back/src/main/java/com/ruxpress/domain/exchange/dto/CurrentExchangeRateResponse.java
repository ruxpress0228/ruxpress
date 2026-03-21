package com.ruxpress.domain.exchange.dto;

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
public class CurrentExchangeRateResponse {

    private Long id;
    private String baseCurrency;
    private String targetCurrency;
    private BigDecimal rate;
    private LocalDateTime fetchedAt;
    private ExchangeRateSource source;

    public static CurrentExchangeRateResponse from(com.ruxpress.domain.exchange.entity.ExchangeRate entity) {
        return CurrentExchangeRateResponse.builder()
                .id(entity.getId())
                .baseCurrency(entity.getBaseCurrency())
                .targetCurrency(entity.getTargetCurrency())
                .rate(entity.getRate())
                .fetchedAt(entity.getFetchedAt())
                .source(entity.getSource())
                .build();
    }
}
