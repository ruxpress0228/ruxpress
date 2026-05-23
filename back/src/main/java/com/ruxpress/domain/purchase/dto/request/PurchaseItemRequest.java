package com.ruxpress.domain.purchase.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseItemRequest {

    @NotBlank(message = "URL을 입력해주세요")
    private String url;

    private String shop;

    @NotNull(message = "단가를 입력해주세요")
    @DecimalMin(value = "0.0", inclusive = false, message = "단가는 양수여야 합니다")
    private BigDecimal priceKrw;

    @NotNull
    @Min(value = 1, message = "수량은 1 이상이어야 합니다")
    private Integer quantity;

    /** 이 상품 줄에만 해당하는 옵션 (색상·사이즈 등). 없으면 생략. */
    private Map<String, String> options;
}
