package com.ruxpress.domain.product.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.product.dto.response.WishToggleResponse;
import com.ruxpress.domain.product.dto.response.WishlistItemResponse;
import com.ruxpress.domain.product.service.WishlistService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 회원 찜 목록. 회원 JWT 가 없으면(관리자 토큰 포함) UNAUTHORIZED. */
@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<PageResponse<WishlistItemResponse>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(wishlistService.list(userId, PageRequest.of(page, size)));
    }

    @GetMapping("/ids")
    public ApiResponse<List<Long>> ids(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(wishlistService.ids(userId));
    }

    @PostMapping("/{productId}")
    public ApiResponse<WishToggleResponse> add(HttpServletRequest request, @PathVariable Long productId) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(wishlistService.add(userId, productId));
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<WishToggleResponse> remove(HttpServletRequest request, @PathVariable Long productId) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(wishlistService.remove(userId, productId));
    }

    private Long resolveUserId(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return userId;
    }
}
