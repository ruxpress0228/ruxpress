package com.ruxpress.domain.product.repository;

import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /** 관리자 목록: 미삭제 전체. keyword(상품명/쇼핑몰, 대소문자 무시)·status 는 null 이면 필터 없음. */
    @Query(value = """
            SELECT p FROM Product p
            WHERE p.deletedAt IS NULL
              AND (:status IS NULL OR p.status = :status)
              AND (:keyword IS NULL
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.shopName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY p.sortOrder ASC, p.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(p) FROM Product p
            WHERE p.deletedAt IS NULL
              AND (:status IS NULL OR p.status = :status)
              AND (:keyword IS NULL
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.shopName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Product> findAllForAdmin(@Param("keyword") String keyword,
                                  @Param("status") ProductStatus status,
                                  Pageable pageable);

    /** 공개 목록: ACTIVE·미삭제. category 는 정확 일치, keyword 는 상품명/쇼핑몰 포함 검색(둘 다 null 이면 필터 없음). */
    @Query(value = """
            SELECT p FROM Product p
            WHERE p.deletedAt IS NULL
              AND p.status = com.ruxpress.domain.product.entity.ProductStatus.ACTIVE
              AND (:category IS NULL OR p.category = :category)
              AND (:keyword IS NULL
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.shopName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY p.isFeatured DESC, p.sortOrder ASC, p.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(p) FROM Product p
            WHERE p.deletedAt IS NULL
              AND p.status = com.ruxpress.domain.product.entity.ProductStatus.ACTIVE
              AND (:category IS NULL OR p.category = :category)
              AND (:keyword IS NULL
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.shopName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Product> findActive(@Param("category") String category,
                             @Param("keyword") String keyword,
                             Pageable pageable);

    /** 추천 영역: ACTIVE·미삭제를 추천 우선 정렬로, Pageable 의 size 만큼만 반환. */
    @Query("""
            SELECT p FROM Product p
            WHERE p.deletedAt IS NULL
              AND p.status = com.ruxpress.domain.product.entity.ProductStatus.ACTIVE
            ORDER BY p.isFeatured DESC, p.sortOrder ASC, p.createdAt DESC
            """)
    List<Product> findFeatured(Pageable pageable);

    /** ACTIVE·미삭제 상품의 카테고리(null 제외) 중복 제거 + 정렬. */
    @Query("""
            SELECT DISTINCT p.category FROM Product p
            WHERE p.deletedAt IS NULL
              AND p.status = com.ruxpress.domain.product.entity.ProductStatus.ACTIVE
              AND p.category IS NOT NULL
            ORDER BY p.category ASC
            """)
    List<String> findActiveCategories();

    Optional<Product> findByIdAndStatusAndDeletedAtIsNull(Long id, ProductStatus status);

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);
}
