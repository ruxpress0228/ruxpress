package com.ruxpress.domain.purchase.dto.request;

import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminPurchaseStatusRequest {

    @NotNull
    private PurchaseRequestStatus status;

    private String adminMemo;

    private String trackingNumber;
}
