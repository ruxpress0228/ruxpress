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

    private List<String> urls;

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
            if (priceKrw == null || priceKrw.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "상품 가격은 양수여야 합니다.");
            }
        }
        return true;
    }
}
