package com.ruxpress.domain.admin.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.util.SortUtils;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestListResponse;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.domain.purchase.service.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/purchase-requests")
@RequiredArgsConstructor
public class AdminPurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    public ApiResponse<PageResponse<PurchaseRequestListResponse>> getAllPurchaseRequests(
            @RequestParam(required = false) PurchaseRequestStatus status,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Sort parsedSort = parseSort(sort);
        return ApiResponse.success(
                purchaseService.getAllPurchaseRequests(status, PageRequest.of(page, size, SortUtils.parseCreatedAt(sort)))
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<PurchaseRequestResponse> getPurchaseRequest(@PathVariable Long id) {
        return ApiResponse.success(purchaseService.getPurchaseRequestById(id));
    }
}
