package com.ruxpress.domain.exchange.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ManualExchangeRateRequest {

    @DecimalMin(value = "0.01", message = "환율은 0.01 이상이어야 합니다")
    private BigDecimal rate;
}
