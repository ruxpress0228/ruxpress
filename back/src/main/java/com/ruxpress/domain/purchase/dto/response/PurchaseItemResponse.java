package com.ruxpress.domain.purchase.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@AllArgsConstructor
public class PurchaseItemResponse {

    private final String url;
    private final String shop;
    private final BigDecimal priceKrw;
    private final Integer quantity;
    private final Map<String, String> options;
}
