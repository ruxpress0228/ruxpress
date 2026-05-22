package com.ruxpress.domain.purchase.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestCreateRequest {

    @NotBlank(message = "상품명을 입력해주세요")
    @Size(max = 300)
    private String productName;

    @Min(value = 1, message = "수량은 1 이상이어야 합니다")
    private Integer quantity;

    /** 레거시 단순 URL 배열. 새 클라이언트는 items 를 보낸다. */
    private List<String> urls;

    /** URL별 단가·수량 분리. items 가 비어있지 않으면 quantity/priceKrw/urls 보다 우선. */
    private List<@jakarta.validation.Valid PurchaseItemRequest> items;

    private JsonNode options;

    private BigDecimal priceRub;

    private BigDecimal priceKrw;

    private Long exchangeRateId;

    private BigDecimal feeAmount;

    private BigDecimal totalAmountKrw;

    @Size(max = 5000)
    private String memo;

    private PurchaseRequestStatus status;

    public boolean isValid() {
        if (status == PurchaseRequestStatus.SUBMITTED) {
            boolean hasItems = items != null && !items.isEmpty();
            boolean hasLegacyPrice = priceKrw != null && priceKrw.compareTo(BigDecimal.ZERO) > 0;
            if (!hasItems && !hasLegacyPrice) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "상품 가격은 양수여야 합니다.");
            }
        }
        return true;
    }
}
