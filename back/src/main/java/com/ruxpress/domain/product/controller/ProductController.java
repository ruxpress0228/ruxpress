package com.ruxpress.domain.product.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.product.dto.response.ProductResponse;
import com.ruxpress.domain.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productService.getActiveProducts(category, keyword, PageRequest.of(page, size)));
    }

    @GetMapping("/featured")
    public ApiResponse<List<ProductResponse>> featured(@RequestParam(defaultValue = "4") int limit) {
        return ApiResponse.success(productService.getFeatured(limit));
    }

    @GetMapping("/categories")
    public ApiResponse<List<String>> categories() {
        return ApiResponse.success(productService.getCategories());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.success(productService.getActiveProduct(id));
    }
}
