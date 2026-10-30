package com.ruxpress.domain.product.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ProductResponse {

    private final Long id;
    private final String name;
    private final String shopName;
    private final String productUrl;
    private final Long priceKrw;
    private final String category;
    private final String description;
    /** 브라우저에서 바로 열 수 있는 URL (FileStoragePort.getViewUrl). 이미지가 없으면 null. */
    private final String imageUrl;
    private final String imageFilename;
    private final ProductStatus status;
    private final boolean isFeatured;
    private final int sortOrder;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /** Explicit so the JSON key is {@code isFeatured}; a Lombok {@code is}-getter alone would serialise as {@code featured}. */
    @JsonProperty("isFeatured")
    public boolean isFeatured() {
        return isFeatured;
    }

    public static ProductResponse from(Product p, String imageUrl) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getShopName(),
                p.getProductUrl(),
                p.getPriceKrw(),
                p.getCategory(),
                p.getDescription(),
                imageUrl,
                p.getImageOriginalFilename(),
                p.getStatus(),
                p.isFeatured(),
                p.getSortOrder(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
