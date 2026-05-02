package com.ruxpress.domain.balance.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.balance.dto.BalanceResponse;
import com.ruxpress.domain.balance.dto.WalletLedgerEntryResponse;
import com.ruxpress.domain.balance.service.BalanceService;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/balances")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @GetMapping("/me")
    public ApiResponse<BalanceResponse> myBalance(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ApiResponse.success(new BalanceResponse(balanceService.getBalance(userId)));
    }

    @GetMapping("/me/ledger")
    public ApiResponse<PageResponse<WalletLedgerEntryResponse>> myLedger(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ApiResponse.success(balanceService.getLedger(userId, page, size));
    }
}
