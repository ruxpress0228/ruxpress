package com.ruxpress.domain.purchase.entity;

import lombok.Getter;

/**
 * 구매 요청에 스냅샷으로 저장되는 배송지 (엔티티 필드와 1:1 매핑용 값 객체).
 */
@Getter
public class PurchaseShippingSnapshot {

    private final Long userAddressId;
    private final String label;
    private final String recipientName;
    private final String recipientPhone;
    private final String postalCode;
    private final String addressLine1;
    private final String addressLine2;

    public PurchaseShippingSnapshot(
            Long userAddressId,
            String label,
            String recipientName,
            String recipientPhone,
            String postalCode,
            String addressLine1,
            String addressLine2) {
        this.userAddressId = userAddressId;
        this.label = label;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.postalCode = postalCode;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
    }
}
