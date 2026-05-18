package com.ruxpress.domain.purchase.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminPurchaseWalletCreditRequest {

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true, message = "금액은 0보다 커야 합니다.")
    private BigDecimal amount;

    @NotBlank
    private String idempotencyKey;

    /** 실제 확정 비용(참고·표시용). 선택 */
    private BigDecimal settledAmountKrw;

    private String adminMemo;
}
