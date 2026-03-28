package com.ruxpress.domain.purchase.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.purchase.dto.request.PurchaseRequestCreateRequest;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestListResponse;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.domain.purchase.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping
    public ApiResponse<PurchaseRequestResponse> createPurchaseRequest(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestBody @Valid PurchaseRequestCreateRequest request
    ) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        PurchaseRequestResponse response = purchaseService.createPurchaseRequest(effectiveUserId, request);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<PageResponse<PurchaseRequestListResponse>> getMyPurchaseRequests(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(required = false) PurchaseRequestStatus status,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        Sort parsedSort = parseSort(sort);
        PageResponse<PurchaseRequestListResponse> response = purchaseService.getMyPurchaseRequests(
                effectiveUserId,
                status,
                PageRequest.of(page, size, parsedSort)
        );
        return ApiResponse.success(response);
    }

    @GetMapping("/recent")
    public ApiResponse<List<PurchaseRequestListResponse>> getRecentMyPurchaseRequests(
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        List<PurchaseRequestListResponse> response = purchaseService.getRecentMyPurchaseRequests(effectiveUserId);
        return ApiResponse.success(response);
    }

    private Sort parseSort(String sort) {
        String[] tokens = sort.split(",");
        String property = tokens.length > 0 ? tokens[0] : "createdAt";
        String direction = tokens.length > 1 ? tokens[1] : "desc";

        if (!"createdAt".equals(property)) {
            property = "createdAt";
        }
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, property);
    }
}
