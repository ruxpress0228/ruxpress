package com.ruxpress.domain.product.dto.response;

import com.ruxpress.domain.product.entity.ProductWishlist;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/** 찜 목록 항목: {@code { id, product, createdAt }}. product 는 공개 목록과 같은 {@link ProductResponse}. */
@Getter
@AllArgsConstructor
public class WishlistItemResponse {

    private final Long id;
    private final ProductResponse product;
    /** 찜한 시각 */
    private final LocalDateTime createdAt;

    public static WishlistItemResponse of(ProductWishlist wish, ProductResponse product) {
        return new WishlistItemResponse(wish.getId(), product, wish.getCreatedAt());
    }
}
