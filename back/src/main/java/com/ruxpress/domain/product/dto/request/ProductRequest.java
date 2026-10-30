package com.ruxpress.domain.product.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ruxpress.domain.product.entity.ProductStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 상품 등록/수정 공용 요청. status/isFeatured/sortOrder 가 비어 있으면 서비스에서 ACTIVE/false/0 으로 기본 처리한다.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "상품명을 입력해주세요")
    @Size(max = 200)
    private String name;

    @NotBlank(message = "판매 쇼핑몰을 입력해주세요")
    @Size(max = 100)
    private String shopName;

    @NotBlank(message = "상품 링크를 입력해주세요")
    @Size(max = 1000)
    private String productUrl;

    @NotNull(message = "참고 가격을 입력해주세요")
    @Min(value = 0, message = "참고 가격은 0 이상이어야 합니다")
    private Long priceKrw;

    @Size(max = 50)
    private String category;

    private String description;

    private ProductStatus status;

    @JsonProperty("isFeatured")
    private Boolean isFeatured;

    private Integer sortOrder;
}
