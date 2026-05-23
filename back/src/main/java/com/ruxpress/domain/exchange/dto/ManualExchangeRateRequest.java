package com.ruxpress.domain.exchange.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ManualExchangeRateRequest {

    /** RUB, USD, CNY — 1 {currency} = rate KRW */
    @NotBlank(message = "통화 코드가 필요합니다")
    private String currency;

    @DecimalMin(value = "0.01", message = "환율은 0.01 이상이어야 합니다")
    private BigDecimal rate;
}
