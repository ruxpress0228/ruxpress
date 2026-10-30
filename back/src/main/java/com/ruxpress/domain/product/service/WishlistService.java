package com.ruxpress.domain.product.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.product.dto.response.WishToggleResponse;
import com.ruxpress.domain.product.dto.response.WishlistItemResponse;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import com.ruxpress.domain.product.entity.ProductWishlist;
import com.ruxpress.domain.product.repository.ProductRepository;
import com.ruxpress.domain.product.repository.ProductWishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** 회원 찜 목록. 상품 응답 매핑은 {@link ProductService#toResponse} 를 그대로 써서 공개 목록과 동일한 형태를 유지한다. */
@Service
@RequiredArgsConstructor
public class WishlistService {

    private final ProductWishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    /** 찜 목록(ACTIVE·미삭제 상품만, 최근 찜 순). 숨김/삭제된 상품은 목록에서 빠지지만 찜 레코드는 유지된다. */
    @Transactional(readOnly = true)
    public PageResponse<WishlistItemResponse> list(Long userId, Pageable pageable) {
        Page<Object[]> page = wishlistRepository.findActiveWithProductByUserId(userId, pageable);
        List<WishlistItemResponse> content = page.getContent().stream().map(this::toItem).toList();
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    /** 회원이 찜한 상품 ID 전체(화면의 찜 표시용). */
    @Transactional(readOnly = true)
    public List<Long> ids(Long userId) {
        return wishlistRepository.findProductIdsByUserId(userId);
    }

    /** 찜 추가. 상품은 ACTIVE·미삭제여야 하고(아니면 NOT_FOUND), 이미 찜한 상품이면 그대로 둔다(멱등). */
    @Transactional
    public WishToggleResponse add(Long userId, Long productId) {
        productRepository.findByIdAndStatusAndDeletedAtIsNull(productId, ProductStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "상품을 찾을 수 없습니다."));
        if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            wishlistRepository.save(ProductWishlist.of(userId, productId));
        }
        return new WishToggleResponse(productId, true, wishlistRepository.countByUserId(userId));
    }

    /** 찜 해제(멱등). 찜하지 않은 상품이어도 오류 없이 현재 개수를 돌려준다. */
    @Transactional
    public WishToggleResponse remove(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        return new WishToggleResponse(productId, false, wishlistRepository.countByUserId(userId));
    }

    private WishlistItemResponse toItem(Object[] row) {
        ProductWishlist wish = (ProductWishlist) row[0];
        Product product = (Product) row[1];
        return WishlistItemResponse.of(wish, productService.toResponse(product));
    }
}
