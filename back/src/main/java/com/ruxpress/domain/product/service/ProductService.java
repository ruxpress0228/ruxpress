package com.ruxpress.domain.product.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.storage.FileStorageUtil;
import com.ruxpress.common.util.ModulePrefix;
import com.ruxpress.domain.product.dto.request.ProductRequest;
import com.ruxpress.domain.product.dto.response.ProductResponse;
import com.ruxpress.domain.product.entity.Product;
import com.ruxpress.domain.product.entity.ProductStatus;
import com.ruxpress.domain.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private static final int FEATURED_LIMIT_MIN = 1;
    private static final int FEATURED_LIMIT_MAX = 12;

    private final ProductRepository productRepository;
    private final FileStoragePort fileStoragePort;

    // ─── User-facing ──────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getActiveProducts(String category, String keyword, Pageable pageable) {
        Page<Product> page = productRepository.findActive(
                normalizeOptional(category), normalizeOptional(keyword), pageable);
        return toPageResponse(page);
    }

    /** ACTIVE 상품을 추천 우선 정렬로 limit 개 반환. limit 은 1..12 로 보정. */
    @Transactional(readOnly = true)
    public List<ProductResponse> getFeatured(int limit) {
        int safeLimit = Math.max(FEATURED_LIMIT_MIN, Math.min(FEATURED_LIMIT_MAX, limit));
        return productRepository.findFeatured(PageRequest.of(0, safeLimit)).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return productRepository.findActiveCategories();
    }

    @Transactional(readOnly = true)
    public ProductResponse getActiveProduct(Long id) {
        Product product = productRepository.findByIdAndStatusAndDeletedAtIsNull(id, ProductStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "상품을 찾을 수 없습니다."));
        return toResponse(product);
    }

    // ─── Admin ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAllForAdmin(String keyword, ProductStatus status, Pageable pageable) {
        Page<Product> page = productRepository.findAllForAdmin(normalizeOptional(keyword), status, pageable);
        return toPageResponse(page);
    }

    @Transactional
    public ProductResponse create(Long adminId, ProductRequest request) {
        Product product = Product.create(
                adminId,
                trim(request.getName()),
                trim(request.getShopName()),
                validateProductUrl(request.getProductUrl()),
                request.getPriceKrw(),
                normalizeOptional(request.getCategory()),
                normalizeOptional(request.getDescription()),
                defaultStatus(request.getStatus()),
                Boolean.TRUE.equals(request.getIsFeatured()),
                defaultSortOrder(request.getSortOrder()));
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findForAdmin(id);
        product.update(
                trim(request.getName()),
                trim(request.getShopName()),
                validateProductUrl(request.getProductUrl()),
                request.getPriceKrw(),
                normalizeOptional(request.getCategory()),
                normalizeOptional(request.getDescription()),
                defaultStatus(request.getStatus()),
                Boolean.TRUE.equals(request.getIsFeatured()),
                defaultSortOrder(request.getSortOrder()));
        return toResponse(productRepository.save(product));
    }

    /** 소프트 삭제. 저장된 이미지 파일은 best-effort 로 함께 삭제(저장소 오류는 무시). */
    @Transactional
    public void delete(Long id) {
        Product product = findForAdmin(id);
        String storedUrl = product.getImageStoredUrl();
        product.markDeleted();
        productRepository.save(product);
        deleteStoredFileQuietly(storedUrl);
    }

    /** 대표 이미지 업로드(교체). 이전 파일은 best-effort 로 삭제(저장소 오류는 무시). */
    @Transactional
    public ProductResponse uploadImage(Long id, MultipartFile file) {
        Product product = findForAdmin(id);
        FileStorageUtil.validateImageOrThrow(file);

        String storedUrl;
        try {
            storedUrl = fileStoragePort.store(ModulePrefix.PRODUCT, file);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Product image upload failed. productId={}", id, e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
        }

        String previousStoredUrl = product.getImageStoredUrl();
        String originalFilename = file.getOriginalFilename();
        product.attachImage(storedUrl, originalFilename != null && !originalFilename.isBlank() ? originalFilename : "file");
        Product saved = productRepository.save(product);

        if (previousStoredUrl != null && !previousStoredUrl.equals(storedUrl)) {
            deleteStoredFileQuietly(previousStoredUrl);
        }
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse deleteImage(Long id) {
        Product product = findForAdmin(id);
        String previousStoredUrl = product.getImageStoredUrl();
        product.removeImage();
        Product saved = productRepository.save(product);
        deleteStoredFileQuietly(previousStoredUrl);
        return toResponse(saved);
    }

    // ─── Helpers ──────────────────────────────────────────

    private Product findForAdmin(Long id) {
        return productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "상품을 찾을 수 없습니다."));
    }

    private void deleteStoredFileQuietly(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) {
            return;
        }
        try {
            fileStoragePort.delete(storedUrl);
        } catch (Exception e) {
            log.warn("Failed to delete product image file: {}", storedUrl, e);
        }
    }

    private PageResponse<ProductResponse> toPageResponse(Page<Product> page) {
        List<ProductResponse> content = page.getContent().stream().map(this::toResponse).toList();
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    private ProductResponse toResponse(Product p) {
        String imageUrl = p.hasImage() ? fileStoragePort.getViewUrl(p.getImageStoredUrl()) : null;
        return ProductResponse.from(p, imageUrl);
    }

    private static String validateProductUrl(String rawUrl) {
        String url = trim(rawUrl);
        String lower = url == null ? "" : url.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "상품 링크는 http:// 또는 https:// 로 시작해야 합니다.");
        }
        return url;
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    /** 공백/빈 문자열은 null 로, 그 외는 trim. */
    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static ProductStatus defaultStatus(ProductStatus status) {
        return status != null ? status : ProductStatus.ACTIVE;
    }

    private static int defaultSortOrder(Integer sortOrder) {
        return sortOrder != null ? sortOrder : 0;
    }
}
