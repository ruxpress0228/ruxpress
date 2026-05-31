package com.ruxpress.domain.purchase.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class PurchaseItemResponse {

    /** 첫 번째 URL (레거시 호환) */
    private final String url;

    /** 항목 내 전체 URL 목록 */
    private final List<String> urls;

    private final String shop;
    private final BigDecimal priceKrw;
    private final Integer quantity;
    private final Map<String, String> options;
}
