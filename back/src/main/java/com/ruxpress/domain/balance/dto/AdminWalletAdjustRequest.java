package com.ruxpress.domain.balance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AdminWalletAdjustRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "금액은 0보다 커야 합니다.")
    @Digits(integer = 16, fraction = 2)
    private BigDecimal amount;

    @Size(max = 500)
    private String memo;
}
