package com.ruxpress.domain.purchase.dto.request;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseItemRequest {

    /** 레거시 단일 URL (첫 번째 URL과 동일하게 저장) */
    private String url;

    /** 동일 상품 항목의 URL 목록 (신규). urls 가 있으면 url 보다 우선. */
    private List<String> urls;

    private String shop;

    @NotNull(message = "단가를 입력해주세요")
    @DecimalMin(value = "0.0", inclusive = false, message = "단가는 양수여야 합니다")
    private BigDecimal priceKrw;

    @NotNull
    @Min(value = 1, message = "수량은 1 이상이어야 합니다")
    private Integer quantity;

    /** 이 상품 줄에만 해당하는 옵션 (색상·사이즈 등). 없으면 생략. */
    private Map<String, String> options;

    public List<String> resolvedUrls() {
        Set<String> ordered = new LinkedHashSet<>();
        if (urls != null) {
            for (String u : urls) {
                if (u != null) {
                    String trimmed = u.trim();
                    if (!trimmed.isEmpty()) {
                        ordered.add(trimmed);
                    }
                }
            }
        }
        if (ordered.isEmpty() && url != null) {
            String trimmed = url.trim();
            if (!trimmed.isEmpty()) {
                ordered.add(trimmed);
            }
        }
        return new ArrayList<>(ordered);
    }

    public void validateUrlsPresent() {
        if (resolvedUrls().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "URL을 입력해주세요");
        }
    }
}
