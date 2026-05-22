package com.ruxpress.domain.admin.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.util.SortUtils;
import com.ruxpress.domain.purchase.dto.request.AdminPurchaseStatusRequest;
import com.ruxpress.domain.purchase.dto.request.AdminPurchaseWalletCreditRequest;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.domain.purchase.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/v1/admin/purchases")
@RequiredArgsConstructor
public class AdminPurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    public ApiResponse<PageResponse<PurchaseRequestResponse>> list(
            @RequestParam(required = false) PurchaseRequestStatus status,
            @RequestParam(required = false) String userKeyword,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Sort parsedSort = SortUtils.parseSort(sort);
        return ApiResponse.success(
                purchaseService.getAdminPurchaseRequests(status, userKeyword, PageRequest.of(page, size, parsedSort)));
    }

    @GetMapping("/{id}")
    public ApiResponse<PurchaseRequestResponse> detail(@PathVariable Long id) {
        return ApiResponse.success(purchaseService.getAdminPurchaseRequestDetail(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<PurchaseRequestResponse> updateStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody @Valid AdminPurchaseStatusRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.success(purchaseService.updatePurchaseRequestStatus(id, adminId, request));
    }

    @PostMapping("/{id}/wallet-credits")
    public ApiResponse<PurchaseRequestResponse> creditWallet(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody @Valid AdminPurchaseWalletCreditRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.success(purchaseService.creditPurchaseWalletAdjustment(id, adminId, request));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PurchaseRequestResponse> uploadAttachments(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files) {
        return ApiResponse.success(purchaseService.uploadAdminAttachments(id, files));
    }
}
