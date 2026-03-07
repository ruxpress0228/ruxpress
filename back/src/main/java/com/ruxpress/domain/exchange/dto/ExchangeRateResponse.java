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
public class ExchangeRateResponse {

    private Long id;
    private String baseCurrency;
    private String targetCurrency;
    private BigDecimal rate;
    private ExchangeRateSource source;
    private Long adminId;
    private Boolean isCurrent;
    private LocalDateTime fetchedAt;
    private LocalDateTime createdAt;

    public static ExchangeRateResponse from(com.ruxpress.domain.exchange.entity.ExchangeRate entity) {
        return ExchangeRateResponse.builder()
                .id(entity.getId())
                .baseCurrency(entity.getBaseCurrency())
                .targetCurrency(entity.getTargetCurrency())
                .rate(entity.getRate())
                .source(entity.getSource())
                .adminId(entity.getAdminId())
                .isCurrent(entity.getIsCurrent())
                .fetchedAt(entity.getFetchedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
