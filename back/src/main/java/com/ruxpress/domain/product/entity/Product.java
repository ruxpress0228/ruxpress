package com.ruxpress.domain.product.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 관리자가 큐레이션하는 추천 상품. 이미지는 관리자 업로드 파일만 허용(외부 URL 핫링크 없음).
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "products")
public class Product extends BaseEntity {

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "shop_name", nullable = false, length = 100)
    private String shopName;

    @Column(name = "product_url", nullable = false, length = 1000)
    private String productUrl;

    @Column(name = "price_krw", nullable = false)
    private Long priceKrw;

    @Column(length = 50)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_stored_url", length = 500)
    private String imageStoredUrl;

    @Column(name = "image_original_filename", length = 300)
    private String imageOriginalFilename;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(name = "is_featured", nullable = false)
    private boolean isFeatured = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /** 공개 상세 조회 횟수. {@code ProductRepository.incrementViewCount} 의 벌크 UPDATE 로만 증가한다. */
    @Column(name = "view_count", nullable = false)
    private long viewCount = 0L;

    public static Product create(Long adminId, String name, String shopName, String productUrl, Long priceKrw,
                                 String category, String description, ProductStatus status,
                                 boolean isFeatured, int sortOrder) {
        Product p = new Product();
        p.adminId = adminId;
        p.name = name;
        p.shopName = shopName;
        p.productUrl = productUrl;
        p.priceKrw = priceKrw;
        p.category = category;
        p.description = description;
        p.status = status;
        p.isFeatured = isFeatured;
        p.sortOrder = sortOrder;
        return p;
    }

    public void update(String name, String shopName, String productUrl, Long priceKrw,
                       String category, String description, ProductStatus status,
                       boolean isFeatured, int sortOrder) {
        this.name = name;
        this.shopName = shopName;
        this.productUrl = productUrl;
        this.priceKrw = priceKrw;
        this.category = category;
        this.description = description;
        this.status = status;
        this.isFeatured = isFeatured;
        this.sortOrder = sortOrder;
    }

    public void attachImage(String storedUrl, String originalFilename) {
        this.imageStoredUrl = storedUrl;
        this.imageOriginalFilename = originalFilename;
    }

    public void removeImage() {
        this.imageStoredUrl = null;
        this.imageOriginalFilename = null;
    }

    public boolean hasImage() {
        return imageStoredUrl != null && !imageStoredUrl.isBlank();
    }
}
