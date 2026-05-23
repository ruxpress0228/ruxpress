package com.ruxpress.domain.purchase.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class PurchaseRequestResponse {

    private final Long id;
    private final Long userId;
    private final String userEmail;
    private final String userNickname;
    private final String requestNumber;
    private final String requestName;
    private final Integer quantity;
    private final List<String> urls;
    private final JsonNode options;
    private final BigDecimal priceRub;
    private final String quoteCurrency;
    private final BigDecimal priceKrw;
    private final Long exchangeRateId;
    private final BigDecimal feeAmount;
    private final BigDecimal totalAmountKrw;
    private final BigDecimal chargedAmountKrw;
    private final BigDecimal settledAmountKrw;
    private final String memo;
    private final PurchaseRequestStatus status;
    private final String adminMemo;
    private final Long assignedAdminId;
    private final String trackingNumber;
    private final PurchaseShippingResponse shipping;
    private final List<PurchaseItemResponse> items;
    private final List<AttachmentResponse> attachments;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
}
