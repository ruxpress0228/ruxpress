package com.ruxpress.domain.product.repository;

import com.ruxpress.domain.product.entity.ProductWishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductWishlistRepository extends JpaRepository<ProductWishlist, Long> {

    Optional<ProductWishlist> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    /** 물리 삭제. 없으면 0 을 돌려주고 오류 없음(멱등). 트랜잭션 필요. */
    long deleteByUserIdAndProductId(Long userId, Long productId);

    long countByUserId(Long userId);

    /** 회원이 찜한 상품 ID 전체(숨김·삭제된 상품 포함 — 목록 화면의 찜 표시용). */
    @Query("SELECT w.productId FROM ProductWishlist w WHERE w.userId = :userId")
    List<Long> findProductIdsByUserId(@Param("userId") Long userId);

    /**
     * 회원 찜 목록 + 상품(ACTIVE·미삭제만), 최근 찜 순(동시각은 id 역순).
     * 각 행은 {@code Object[]{ProductWishlist, Product}}.
     */
    @Query(value = """
            SELECT w, p FROM ProductWishlist w
            JOIN Product p ON p.id = w.productId
            WHERE w.userId = :userId
              AND p.deletedAt IS NULL
              AND p.status = com.ruxpress.domain.product.entity.ProductStatus.ACTIVE
            ORDER BY w.createdAt DESC, w.id DESC
            """,
            countQuery = """
            SELECT COUNT(w) FROM ProductWishlist w
            JOIN Product p ON p.id = w.productId
            WHERE w.userId = :userId
              AND p.deletedAt IS NULL
              AND p.status = com.ruxpress.domain.product.entity.ProductStatus.ACTIVE
            """)
    Page<Object[]> findActiveWithProductByUserId(@Param("userId") Long userId, Pageable pageable);
}
