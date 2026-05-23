package com.ruxpress.domain.purchase.entity;

public enum PurchaseRequestStatus {
    REQUESTED, // 요청접수
    PURCHASING, // 구매진행중
    SHIPPING, // 배송중
    COMPLETED, // 완료
    CANCELLED // 취소
}
