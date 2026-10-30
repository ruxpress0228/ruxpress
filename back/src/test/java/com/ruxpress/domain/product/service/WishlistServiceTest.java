package com.ruxpress.domain.product.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.domain.product.dto.response.WishToggleResponse;
import com.ruxpress.domain.product.dto.response.WishlistItemResponse;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import com.ruxpress.domain.product.entity.ProductWishlist;
import com.ruxpress.domain.product.repository.ProductRepository;
import com.ruxpress.domain.product.repository.ProductWishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    private static final String STORED_URL = "product/25/10/30/pegasus.jpg";
    private static final Long USER_ID = 7L;

    @Mock
    private ProductWishlistRepository wishlistRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private FileStoragePort fileStoragePort;

    private WishlistService wishlistService;

    @BeforeEach
    void setUp() {
        // 실제 ProductService 를 끼워 찜 목록의 상품이 공개 목록과 같은 경로(fileStoragePort.getViewUrl)로 매핑되는지 확인한다.
        wishlistService = new WishlistService(wishlistRepository, productRepository,
                new ProductService(productRepository, fileStoragePort));
    }

    // ─── add ──────────────────────────────────────────────

    @Test
    void add_savesNewWishAndReturnsWishedWithCount() {
        when(productRepository.findByIdAndStatusAndDeletedAtIsNull(3L, ProductStatus.ACTIVE))
                .thenReturn(Optional.of(product(3L)));
        when(wishlistRepository.existsByUserIdAndProductId(USER_ID, 3L)).thenReturn(false);
        when(wishlistRepository.countByUserId(USER_ID)).thenReturn(4L);

        WishToggleResponse response = wishlistService.add(USER_ID, 3L);

        ArgumentCaptor<ProductWishlist> captor = ArgumentCaptor.forClass(ProductWishlist.class);
        verify(wishlistRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(captor.getValue().getProductId()).isEqualTo(3L);
        assertThat(response.getProductId()).isEqualTo(3L);
        assertThat(response.isWished()).isTrue();
        assertThat(response.getCount()).isEqualTo(4L);
    }

    @Test
    void add_isIdempotentWhenAlreadyWished() {
        when(productRepository.findByIdAndStatusAndDeletedAtIsNull(3L, ProductStatus.ACTIVE))
                .thenReturn(Optional.of(product(3L)));
        when(wishlistRepository.existsByUserIdAndProductId(USER_ID, 3L)).thenReturn(true);
        when(wishlistRepository.countByUserId(USER_ID)).thenReturn(1L);

        WishToggleResponse response = wishlistService.add(USER_ID, 3L);

        verify(wishlistRepository, never()).save(any());
        assertThat(response.getProductId()).isEqualTo(3L);
        assertThat(response.isWished()).isTrue();
        assertThat(response.getCount()).isEqualTo(1L);
    }

    @Test
    void add_throwsNotFoundWhenProductHiddenOrDeleted() {
        when(productRepository.findByIdAndStatusAndDeletedAtIsNull(3L, ProductStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.add(USER_ID, 3L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);

        verify(wishlistRepository, never()).existsByUserIdAndProductId(any(), any());
        verify(wishlistRepository, never()).save(any());
        verify(wishlistRepository, never()).countByUserId(any());
    }

    // ─── remove ───────────────────────────────────────────

    @Test
    void remove_deletesAndReturnsRemainingCount() {
        when(wishlistRepository.deleteByUserIdAndProductId(USER_ID, 3L)).thenReturn(1L);
        when(wishlistRepository.countByUserId(USER_ID)).thenReturn(2L);

        WishToggleResponse response = wishlistService.remove(USER_ID, 3L);

        verify(wishlistRepository).deleteByUserIdAndProductId(USER_ID, 3L);
        assertThat(response.getProductId()).isEqualTo(3L);
        assertThat(response.isWished()).isFalse();
        assertThat(response.getCount()).isEqualTo(2L);
    }

    @Test
    void remove_isIdempotentWhenNotWishedAndDoesNotCheckProduct() {
        when(wishlistRepository.deleteByUserIdAndProductId(USER_ID, 3L)).thenReturn(0L);
        when(wishlistRepository.countByUserId(USER_ID)).thenReturn(0L);

        WishToggleResponse response = wishlistService.remove(USER_ID, 3L);

        assertThat(response.getProductId()).isEqualTo(3L);
        assertThat(response.isWished()).isFalse();
        assertThat(response.getCount()).isZero();
        verify(productRepository, never()).findByIdAndStatusAndDeletedAtIsNull(any(), any());
    }

    // ─── ids ──────────────────────────────────────────────

    @Test
    void ids_returnsRepositoryIdsAsIs() {
        when(wishlistRepository.findProductIdsByUserId(USER_ID)).thenReturn(List.of(3L, 1L));

        assertThat(wishlistService.ids(USER_ID)).containsExactly(3L, 1L);
    }

    @Test
    void ids_returnsEmptyListWhenNothingWished() {
        when(wishlistRepository.findProductIdsByUserId(USER_ID)).thenReturn(List.of());

        assertThat(wishlistService.ids(USER_ID)).isEmpty();
    }

    // ─── list ─────────────────────────────────────────────

    @Test
    void list_mapsRowsToItemsWithProductViewUrl() {
        Pageable pageable = PageRequest.of(0, 24);
        Product product = product(3L);
        product.attachImage(STORED_URL, "pegasus.jpg");
        ProductWishlist wish = wish(5L, USER_ID, 3L, LocalDateTime.of(2026, 10, 30, 4, 0));
        List<Object[]> rows = Collections.singletonList(new Object[]{wish, product});
        when(wishlistRepository.findActiveWithProductByUserId(USER_ID, pageable))
                .thenReturn(new PageImpl<>(rows, pageable, 1));
        when(fileStoragePort.getViewUrl(STORED_URL)).thenReturn("/api/v1/local-files/" + STORED_URL);

        PageResponse<WishlistItemResponse> result = wishlistService.list(USER_ID, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(24);
        assertThat(result.getContent()).hasSize(1);
        WishlistItemResponse item = result.getContent().get(0);
        assertThat(item.getId()).isEqualTo(5L);
        assertThat(item.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 10, 30, 4, 0));
        assertThat(item.getProduct().getId()).isEqualTo(3L);
        assertThat(item.getProduct().getName()).isEqualTo("Nike Air Zoom Pegasus 41");
        assertThat(item.getProduct().getPriceKrw()).isEqualTo(129000L);
        assertThat(item.getProduct().isFeatured()).isTrue();
        assertThat(item.getProduct().getImageUrl()).isEqualTo("/api/v1/local-files/" + STORED_URL);
        assertThat(item.getProduct().getImageFilename()).isEqualTo("pegasus.jpg");
    }

    @Test
    void list_returnsEmptyPageWithoutTouchingStorage() {
        Pageable pageable = PageRequest.of(1, 24);
        when(wishlistRepository.findActiveWithProductByUserId(USER_ID, pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        PageResponse<WishlistItemResponse> result = wishlistService.list(USER_ID, pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
        assertThat(result.getPage()).isEqualTo(1);
        verify(fileStoragePort, never()).getViewUrl(any());
    }

    private static Product product(Long id) {
        Product p = Product.create(1L, "Nike Air Zoom Pegasus 41", "Nike KR", "https://www.nike.com/kr/t/pegasus-41",
                129000L, "Shoes", "Daily trainer", ProductStatus.ACTIVE, true, 0);
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    private static ProductWishlist wish(Long id, Long userId, Long productId, LocalDateTime createdAt) {
        ProductWishlist w = ProductWishlist.of(userId, productId);
        ReflectionTestUtils.setField(w, "id", id);
        ReflectionTestUtils.setField(w, "createdAt", createdAt);
        return w;
    }
}
