package com.ruxpress.domain.product.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 회원 찜 목록 (product_wishlists). 회원·상품 조합당 1건(uk_product_wishlists_user_product).
 * BaseEntity 를 상속하지 않는다 — updated_at/deleted_at 컬럼이 없고, 해제는 물리 삭제다.
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "product_wishlists",
        uniqueConstraints = @UniqueConstraint(name = "uk_product_wishlists_user_product", columnNames = {"user_id", "product_id"}),
        indexes = @Index(name = "idx_product_wishlists_user", columnList = "user_id"))
public class ProductWishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ProductWishlist of(Long userId, Long productId) {
        ProductWishlist w = new ProductWishlist();
        w.userId = userId;
        w.productId = productId;
        return w;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
