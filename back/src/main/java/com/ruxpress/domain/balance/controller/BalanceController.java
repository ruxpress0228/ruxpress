package com.ruxpress.domain.balance.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.balance.dto.BalanceResponse;
import com.ruxpress.domain.balance.dto.WalletLedgerEntryResponse;
import com.ruxpress.domain.balance.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/balances")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;
    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ApiResponse<BalanceResponse> myBalance(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Long userId = resolveUserId(authorization);
        return ApiResponse.success(new BalanceResponse(balanceService.getBalance(userId)));
    }

    @GetMapping("/me/ledger")
    public ApiResponse<PageResponse<WalletLedgerEntryResponse>> myLedger(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = resolveUserId(authorization);
        return ApiResponse.success(balanceService.getLedger(userId, page, size));
    }

    private Long resolveUserId(String authorization) {
        Long userId = jwtUtil.resolveUserIdFromAuthorizationHeader(authorization);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
