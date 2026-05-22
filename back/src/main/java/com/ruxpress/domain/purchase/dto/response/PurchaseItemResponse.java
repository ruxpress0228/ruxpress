package com.ruxpress.domain.purchase.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class PurchaseItemResponse {

    private final String url;
    private final String shop;
    private final BigDecimal priceKrw;
    private final Integer quantity;
}
