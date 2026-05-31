package com.ruxpress.domain.balance.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.balance.dto.AdminUserWalletResponse;
import com.ruxpress.domain.balance.dto.AdminWalletAdjustRequest;
import com.ruxpress.domain.balance.dto.AdminWalletAdjustResponse;
import com.ruxpress.domain.balance.dto.WalletLedgerEntryResponse;
import com.ruxpress.domain.balance.service.AdminWalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/wallets")
@RequiredArgsConstructor
public class AdminWalletController {

    private final AdminWalletService adminWalletService;

    @GetMapping
    public ApiResponse<PageResponse<AdminUserWalletResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(adminWalletService.listUsers(keyword, PageRequest.of(page, size)));
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<AdminUserWalletResponse> getUserWallet(@PathVariable Long userId) {
        return ApiResponse.success(adminWalletService.getUserWallet(userId));
    }

    @GetMapping("/users/{userId}/ledger")
    public ApiResponse<PageResponse<WalletLedgerEntryResponse>> getUserLedger(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(adminWalletService.getUserLedger(userId, page, size));
    }

    @PostMapping("/users/{userId}/credit")
    public ApiResponse<AdminWalletAdjustResponse> credit(
            Authentication auth,
            @PathVariable Long userId,
            @Valid @RequestBody AdminWalletAdjustRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.success(adminWalletService.credit(adminId, userId, request));
    }

    @PostMapping("/users/{userId}/debit")
    public ApiResponse<AdminWalletAdjustResponse> debit(
            Authentication auth,
            @PathVariable Long userId,
            @Valid @RequestBody AdminWalletAdjustRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.success(adminWalletService.debit(adminId, userId, request));
    }
}
