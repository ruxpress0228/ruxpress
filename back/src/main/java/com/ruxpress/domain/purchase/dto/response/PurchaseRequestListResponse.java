package com.ruxpress.domain.purchase.dto.response;

import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PurchaseRequestListResponse {

    private final Long id;
    private final String requestNumber;
    private final String productName;
    private final Integer quantity;
    private final BigDecimal totalAmountKrw;
    private final BigDecimal chargedAmountKrw;
    private final BigDecimal settledAmountKrw;
    private final PurchaseRequestStatus status;
    private final LocalDateTime createdAt;
}
