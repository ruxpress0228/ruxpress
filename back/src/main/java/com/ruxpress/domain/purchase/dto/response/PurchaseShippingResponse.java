package com.ruxpress.domain.purchase.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PurchaseShippingResponse {

    private final Long userAddressId;
    private final String label;
    private final String recipientName;
    private final String recipientPhone;
    private final String postalCode;
    private final String addressLine1;
    private final String addressLine2;
}
