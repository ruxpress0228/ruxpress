package com.ruxpress.domain.purchase.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.common.util.SortUtils;
import com.ruxpress.domain.purchase.dto.request.PurchaseRequestCreateRequest;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestListResponse;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.domain.purchase.service.PurchaseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PurchaseRequestResponse> createPurchaseRequest(
            HttpServletRequest request,
            @RequestBody @Valid PurchaseRequestCreateRequest body
    ) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(purchaseService.createPurchaseRequest(userId, body));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PurchaseRequestResponse> createPurchaseRequestWithFiles(
            HttpServletRequest request,
            @RequestPart("purchase") @Valid PurchaseRequestCreateRequest body,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(purchaseService.createPurchaseRequest(userId, body, files));
    }

    @GetMapping
    public ApiResponse<PageResponse<PurchaseRequestListResponse>> getMyPurchaseRequests(
            HttpServletRequest request,
            @RequestParam(required = false) PurchaseRequestStatus status,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(purchaseService.getMyPurchaseRequests(
                userId, status, PageRequest.of(page, size, SortUtils.parseCreatedAt(sort))));
    }

    @GetMapping("/recent")
    public ApiResponse<List<PurchaseRequestListResponse>> getRecentMyPurchaseRequests(
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(purchaseService.getRecentMyPurchaseRequests(userId));
    }

    @GetMapping("/{purchaseRequestId}")
    public ApiResponse<PurchaseRequestResponse> getMyPurchaseRequest(
            HttpServletRequest request,
            @PathVariable Long purchaseRequestId
    ) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(purchaseService.getMyPurchaseRequest(userId, purchaseRequestId));
    }

    private Long resolveUserId(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return userId;
    }
}
