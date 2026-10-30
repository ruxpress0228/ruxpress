package com.ruxpress.domain.product.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.util.ModulePrefix;
import com.ruxpress.domain.product.dto.request.ProductRequest;
import com.ruxpress.domain.product.dto.response.ProductResponse;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductSort;
import com.ruxpress.domain.product.entity.ProductStatus;
import com.ruxpress.domain.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    private static final String OLD_STORED_URL = "product/25/10/29/old.jpg";
    private static final String NEW_STORED_URL = "product/25/10/30/new.jpg";

    @Mock
    private ProductRepository productRepository;

    @Mock
    private FileStoragePort fileStoragePort;

    @InjectMocks
    private ProductService productService;

    // ─── create / update ──────────────────────────────────

    @Test
    void create_mapsFieldsAndAppliesDefaults() {
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 7L);
            return saved;
        });
        ProductRequest request = new ProductRequest(
                "  Nike Air Zoom Pegasus 41 ", " Nike KR ", " https://www.nike.com/kr/t/pegasus-41 ",
                129000L, "   ", "", null, null, null);

        ProductResponse response = productService.create(99L, request);

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        Product saved = captor.getValue();
        assertThat(saved.getAdminId()).isEqualTo(99L);
        assertThat(saved.getName()).isEqualTo("Nike Air Zoom Pegasus 41");
        assertThat(saved.getShopName()).isEqualTo("Nike KR");
        assertThat(saved.getProductUrl()).isEqualTo("https://www.nike.com/kr/t/pegasus-41");
        assertThat(saved.getPriceKrw()).isEqualTo(129000L);
        assertThat(saved.getCategory()).isNull();
        assertThat(saved.getDescription()).isNull();
        assertThat(saved.getStatus()).isEqualTo(ProductStatus.ACTIVE);
        assertThat(saved.isFeatured()).isFalse();
        assertThat(saved.getSortOrder()).isZero();
        assertThat(saved.getImageStoredUrl()).isNull();

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getName()).isEqualTo("Nike Air Zoom Pegasus 41");
        assertThat(response.getShopName()).isEqualTo("Nike KR");
        assertThat(response.getPriceKrw()).isEqualTo(129000L);
        assertThat(response.getCategory()).isNull();
        assertThat(response.getStatus()).isEqualTo(ProductStatus.ACTIVE);
        assertThat(response.isFeatured()).isFalse();
        assertThat(response.getSortOrder()).isZero();
        assertThat(response.getViewCount()).isZero();
        assertThat(response.getImageUrl()).isNull();
        assertThat(response.getImageFilename()).isNull();
        verify(fileStoragePort, never()).getViewUrl(any());
    }

    @Test
    void create_keepsExplicitValues() {
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        ProductRequest request = new ProductRequest(
                "Pegasus", "Nike KR", "http://www.nike.com/kr", 0L,
                " Shoes ", " Light and fast.\nGood for daily runs. ", ProductStatus.HIDDEN, true, 5);

        ProductResponse response = productService.create(1L, request);

        assertThat(response.getCategory()).isEqualTo("Shoes");
        assertThat(response.getDescription()).isEqualTo("Light and fast.\nGood for daily runs.");
        assertThat(response.getStatus()).isEqualTo(ProductStatus.HIDDEN);
        assertThat(response.isFeatured()).isTrue();
        assertThat(response.getSortOrder()).isEqualTo(5);
        assertThat(response.getPriceKrw()).isZero();
    }

    @Test
    void create_rejectsNonHttpUrl() {
        ProductRequest request = new ProductRequest(
                "Pegasus", "Nike KR", "www.nike.com/kr/t/pegasus-41", 129000L,
                null, null, null, null, null);

        assertThatThrownBy(() -> productService.create(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

        verify(productRepository, never()).save(any());
    }

    @Test
    void create_rejectsNonHttpScheme() {
        ProductRequest request = new ProductRequest(
                "Pegasus", "Nike KR", "ftp://files.nike.com/pegasus", 129000L,
                null, null, null, null, null);

        assertThatThrownBy(() -> productService.create(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

        verify(productRepository, never()).save(any());
    }

    @Test
    void update_appliesNormalizedFields() {
        Product product = product(3L);
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        ProductRequest request = new ProductRequest(
                " Pegasus 42 ", "Nike KR", "https://www.nike.com/kr/t/pegasus-42", 139000L,
                "  ", "  ", ProductStatus.HIDDEN, null, 3);

        ProductResponse response = productService.update(3L, request);

        assertThat(product.getName()).isEqualTo("Pegasus 42");
        assertThat(product.getProductUrl()).isEqualTo("https://www.nike.com/kr/t/pegasus-42");
        assertThat(product.getPriceKrw()).isEqualTo(139000L);
        assertThat(product.getCategory()).isNull();
        assertThat(product.getDescription()).isNull();
        assertThat(product.getStatus()).isEqualTo(ProductStatus.HIDDEN);
        assertThat(product.isFeatured()).isFalse();
        assertThat(product.getSortOrder()).isEqualTo(3);
        assertThat(response.getId()).isEqualTo(3L);
        assertThat(response.getStatus()).isEqualTo(ProductStatus.HIDDEN);
    }

    @Test
    void update_throwsNotFoundWhenMissingOrDeleted() {
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.empty());
        ProductRequest request = new ProductRequest(
                "Pegasus", "Nike KR", "https://www.nike.com/kr", 1L, null, null, null, null, null);

        assertThatThrownBy(() -> productService.update(3L, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);

        verify(productRepository, never()).save(any());
    }

    // ─── public reads ─────────────────────────────────────

    @Test
    void getActiveProduct_throwsNotFoundWhenRepositoryReturnsEmpty() {
        when(productRepository.findByIdAndStatusAndDeletedAtIsNull(5L, ProductStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getActiveProduct(5L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);

        verify(productRepository, never()).incrementViewCount(any());
    }

    @Test
    void getActiveProduct_incrementsViewCountAfterActiveCheck() {
        Product product = product(5L);
        when(productRepository.findByIdAndStatusAndDeletedAtIsNull(5L, ProductStatus.ACTIVE))
                .thenReturn(Optional.of(product));

        ProductResponse response = productService.getActiveProduct(5L);

        InOrder inOrder = inOrder(productRepository);
        inOrder.verify(productRepository).findByIdAndStatusAndDeletedAtIsNull(5L, ProductStatus.ACTIVE);
        inOrder.verify(productRepository).incrementViewCount(5L);
        verify(productRepository, times(1)).incrementViewCount(any());
        // 증가는 벌크 UPDATE 로 수행되므로 응답은 증가 전 값(여기서는 0)이어도 된다.
        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getViewCount()).isZero();
    }

    @Test
    void getActiveProduct_resolvesImageViewUrl() {
        Product product = product(5L);
        product.attachImage(OLD_STORED_URL, "old.jpg");
        when(productRepository.findByIdAndStatusAndDeletedAtIsNull(5L, ProductStatus.ACTIVE))
                .thenReturn(Optional.of(product));
        when(fileStoragePort.getViewUrl(OLD_STORED_URL)).thenReturn("/api/v1/local-files/" + OLD_STORED_URL);

        ProductResponse response = productService.getActiveProduct(5L);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getImageUrl()).isEqualTo("/api/v1/local-files/" + OLD_STORED_URL);
        assertThat(response.getImageFilename()).isEqualTo("old.jpg");
    }

    @Test
    void getActiveProducts_normalizesBlankFiltersToNull() {
        Pageable sorted = PageRequest.of(0, 12, ProductSort.RECOMMENDED.toSort());
        when(productRepository.findActive(isNull(), isNull(), eq(sorted)))
                .thenReturn(new PageImpl<>(List.of(product(1L)), sorted, 1));

        PageResponse<ProductResponse> result = productService.getActiveProducts("  ", "", null, PageRequest.of(0, 12));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(12);
    }

    @Test
    void getActiveProducts_trimsFilters() {
        Pageable sorted = PageRequest.of(0, 12, ProductSort.LATEST.toSort());
        when(productRepository.findActive(eq("Shoes"), eq("pegasus"), eq(sorted)))
                .thenReturn(new PageImpl<>(List.of(), sorted, 0));

        PageResponse<ProductResponse> result =
                productService.getActiveProducts(" Shoes ", " pegasus ", "latest", PageRequest.of(0, 12));

        assertThat(result.getContent()).isEmpty();
    }

    // ─── sort (catalogue v2) ──────────────────────────────

    @Test
    void getActiveProducts_mapsEachSortValueToRepositoryOrder() {
        when(productRepository.findActive(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertThat(appliedSort("recommended")).isEqualTo(
                Sort.by(Sort.Order.desc("isFeatured"), Sort.Order.asc("sortOrder"), Sort.Order.desc("createdAt")));
        assertThat(appliedSort("latest")).isEqualTo(
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        assertThat(appliedSort("popular")).isEqualTo(
                Sort.by(Sort.Order.desc("viewCount"), Sort.Order.desc("createdAt")));
        assertThat(appliedSort("priceAsc")).isEqualTo(
                Sort.by(Sort.Order.asc("priceKrw"), Sort.Order.asc("id")));
        assertThat(appliedSort("priceDesc")).isEqualTo(
                Sort.by(Sort.Order.desc("priceKrw"), Sort.Order.desc("id")));
    }

    @Test
    void getActiveProducts_sortIsCaseInsensitiveAndUnknownFallsBackToRecommended() {
        when(productRepository.findActive(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        Sort recommended = Sort.by(Sort.Order.desc("isFeatured"), Sort.Order.asc("sortOrder"), Sort.Order.desc("createdAt"));

        assertThat(appliedSort("LATEST")).isEqualTo(ProductSort.LATEST.toSort());
        assertThat(appliedSort("priceasc")).isEqualTo(ProductSort.PRICE_ASC.toSort());
        assertThat(appliedSort("PRICE_DESC")).isEqualTo(ProductSort.PRICE_DESC.toSort());
        assertThat(appliedSort(" popular ")).isEqualTo(ProductSort.POPULAR.toSort());
        assertThat(appliedSort("unknown")).isEqualTo(recommended);
        assertThat(appliedSort("   ")).isEqualTo(recommended);
        assertThat(appliedSort(null)).isEqualTo(recommended);
    }

    @Test
    void getActiveProducts_keepsPageNumberAndSizeWhenApplyingSort() {
        Pageable expected = PageRequest.of(2, 24, ProductSort.PRICE_ASC.toSort());
        when(productRepository.findActive(eq("Shoes"), isNull(), eq(expected)))
                .thenReturn(new PageImpl<>(List.of(product(1L)), expected, 49));

        PageResponse<ProductResponse> result =
                productService.getActiveProducts("Shoes", null, "priceAsc", PageRequest.of(2, 24));

        assertThat(result.getPage()).isEqualTo(2);
        assertThat(result.getSize()).isEqualTo(24);
        assertThat(result.getTotalElements()).isEqualTo(49);
        assertThat(result.getTotalPages()).isEqualTo(3);
    }

    /** Calls the public list with the given sort and returns the Sort the repository actually received. */
    private Sort appliedSort(String sort) {
        productService.getActiveProducts(null, null, sort, PageRequest.of(0, 12));
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository, atLeastOnce()).findActive(isNull(), isNull(), captor.capture());
        Pageable applied = captor.getValue();
        assertThat(applied.getPageNumber()).isZero();
        assertThat(applied.getPageSize()).isEqualTo(12);
        return applied.getSort();
    }

    @Test
    void getFeatured_clampsLimitBetweenOneAndTwelve() {
        when(productRepository.findFeatured(any(Pageable.class))).thenReturn(List.of());

        productService.getFeatured(100);
        productService.getFeatured(0);
        productService.getFeatured(4);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository, times(3)).findFeatured(captor.capture());
        assertThat(captor.getAllValues().stream().map(Pageable::getPageSize).toList())
                .containsExactly(12, 1, 4);
        assertThat(captor.getAllValues().stream().map(Pageable::getPageNumber).toList())
                .containsOnly(0);
    }

    @Test
    void getAllForAdmin_passesStatusAndNormalizedKeyword() {
        Pageable pageable = PageRequest.of(0, 20);
        when(productRepository.findAllForAdmin(eq("nike"), eq(ProductStatus.HIDDEN), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(product(1L)), pageable, 1));

        PageResponse<ProductResponse> result = productService.getAllForAdmin(" nike ", ProductStatus.HIDDEN, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalPages()).isEqualTo(1);
    }

    // ─── image ────────────────────────────────────────────

    @Test
    void uploadImage_storesViaPortAttachesStoredUrlAndDeletesPreviousFile() {
        Product product = product(3L);
        product.attachImage(OLD_STORED_URL, "old.jpg");
        MockMultipartFile file = new MockMultipartFile("file", "pegasus.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.store(ModulePrefix.PRODUCT, file)).thenReturn(NEW_STORED_URL);
        when(fileStoragePort.getViewUrl(NEW_STORED_URL)).thenReturn("/api/v1/local-files/" + NEW_STORED_URL);

        ProductResponse response = productService.uploadImage(3L, file);

        assertThat(product.getImageStoredUrl()).isEqualTo(NEW_STORED_URL);
        assertThat(product.getImageOriginalFilename()).isEqualTo("pegasus.jpg");
        assertThat(response.getImageUrl()).isEqualTo("/api/v1/local-files/" + NEW_STORED_URL);
        assertThat(response.getImageFilename()).isEqualTo("pegasus.jpg");
        verify(fileStoragePort).store(ModulePrefix.PRODUCT, file);
        verify(fileStoragePort).delete(OLD_STORED_URL);
        verify(productRepository).save(product);
    }

    @Test
    void uploadImage_withoutPreviousImageDoesNotDeleteAnything() {
        Product product = product(3L);
        MockMultipartFile file = new MockMultipartFile("file", "pegasus.png", "image/png", new byte[]{1});
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.store(ModulePrefix.PRODUCT, file)).thenReturn(NEW_STORED_URL);
        when(fileStoragePort.getViewUrl(NEW_STORED_URL)).thenReturn("/api/v1/local-files/" + NEW_STORED_URL);

        productService.uploadImage(3L, file);

        verify(fileStoragePort, never()).delete(any());
    }

    @Test
    void uploadImage_ignoresFailureWhileDeletingPreviousFile() {
        Product product = product(3L);
        product.attachImage(OLD_STORED_URL, "old.jpg");
        MockMultipartFile file = new MockMultipartFile("file", "pegasus.webp", "image/webp", new byte[]{1});
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.store(ModulePrefix.PRODUCT, file)).thenReturn(NEW_STORED_URL);
        when(fileStoragePort.getViewUrl(NEW_STORED_URL)).thenReturn("/api/v1/local-files/" + NEW_STORED_URL);
        doThrow(new RuntimeException("storage down")).when(fileStoragePort).delete(OLD_STORED_URL);

        ProductResponse response = productService.uploadImage(3L, file);

        assertThat(response.getImageUrl()).isEqualTo("/api/v1/local-files/" + NEW_STORED_URL);
        assertThat(product.getImageStoredUrl()).isEqualTo(NEW_STORED_URL);
    }

    @Test
    void uploadImage_rejectsNonImageContentType() {
        Product product = product(3L);
        MockMultipartFile file = new MockMultipartFile("file", "notes.txt", "text/plain", new byte[]{1});
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.uploadImage(3L, file))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

        verify(fileStoragePort, never()).store(any(), any());
        verify(productRepository, never()).save(any());
    }

    @Test
    void uploadImage_wrapsStorageFailure() {
        Product product = product(3L);
        MockMultipartFile file = new MockMultipartFile("file", "pegasus.jpg", "image/jpeg", new byte[]{1});
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));
        when(fileStoragePort.store(ModulePrefix.PRODUCT, file)).thenThrow(new RuntimeException("disk full"));

        assertThatThrownBy(() -> productService.uploadImage(3L, file))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_UPLOAD_FAILED);

        assertThat(product.getImageStoredUrl()).isNull();
        verify(productRepository, never()).save(any());
    }

    @Test
    void deleteImage_clearsImageAndDeletesFile() {
        Product product = product(3L);
        product.attachImage(OLD_STORED_URL, "old.jpg");
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductResponse response = productService.deleteImage(3L);

        assertThat(product.getImageStoredUrl()).isNull();
        assertThat(product.getImageOriginalFilename()).isNull();
        assertThat(response.getImageUrl()).isNull();
        assertThat(response.getImageFilename()).isNull();
        verify(fileStoragePort).delete(OLD_STORED_URL);
        verify(fileStoragePort, never()).getViewUrl(any());
    }

    // ─── delete ───────────────────────────────────────────

    @Test
    void delete_marksDeletedAndRemovesImageFile() {
        Product product = product(3L);
        product.attachImage(OLD_STORED_URL, "old.jpg");
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));

        productService.delete(3L);

        assertThat(product.getDeletedAt()).isNotNull();
        verify(productRepository).save(product);
        verify(fileStoragePort).delete(OLD_STORED_URL);
    }

    @Test
    void delete_withoutImageDoesNotTouchStorage() {
        Product product = product(3L);
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.of(product));

        productService.delete(3L);

        assertThat(product.getDeletedAt()).isNotNull();
        verify(fileStoragePort, never()).delete(any());
    }

    @Test
    void delete_throwsNotFoundWhenAlreadyDeleted() {
        when(productRepository.findByIdAndDeletedAtIsNull(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.delete(3L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);
    }

    private static Product product(Long id) {
        Product p = Product.create(1L, "Nike Air Zoom Pegasus 41", "Nike KR", "https://www.nike.com/kr/t/pegasus-41",
                129000L, "Shoes", "Daily trainer", ProductStatus.ACTIVE, true, 0);
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }
}
