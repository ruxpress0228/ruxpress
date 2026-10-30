package com.ruxpress.domain.product.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.product.dto.request.ProductRequest;
import com.ruxpress.domain.product.dto.response.ProductResponse;
import com.ruxpress.domain.product.entity.ProductStatus;
import com.ruxpress.domain.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProductStatus status) {
        return ApiResponse.success(productService.getAllForAdmin(keyword, status, PageRequest.of(page, size)));
    }

    @PostMapping
    public ApiResponse<ProductResponse> create(
            Authentication auth,
            @Valid @RequestBody ProductRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(productService.create(adminId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ApiResponse.success(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ApiResponse.success(null);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ProductResponse> uploadImage(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(productService.uploadImage(id, file));
    }

    @DeleteMapping("/{id}/image")
    public ApiResponse<ProductResponse> deleteImage(@PathVariable Long id) {
        return ApiResponse.success(productService.deleteImage(id));
    }
}
