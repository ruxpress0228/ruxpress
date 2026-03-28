package com.ruxpress.domain.banktransfer.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.banktransfer.dto.request.DepositReportRequest;
import com.ruxpress.domain.banktransfer.dto.response.LedgerReceiptResponse;
import com.ruxpress.domain.banktransfer.dto.response.SettlementAccountResponse;
import com.ruxpress.domain.banktransfer.dto.response.TransferLedgerEntryResponse;
import com.ruxpress.domain.banktransfer.service.BankTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bank-transfers")
@RequiredArgsConstructor
public class BankTransferController {

    private final BankTransferService bankTransferService;

    @GetMapping("/settlement-accounts")
    public ApiResponse<List<SettlementAccountResponse>> listSettlementAccounts() {
        return ApiResponse.success(bankTransferService.listActiveSettlementAccountsForUser());
    }

    @PostMapping("/deposit-reports")
    public ApiResponse<TransferLedgerEntryResponse> createDepositReport(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody DepositReportRequest request) {
        Long effectiveUserId = userId != null ? userId : 1L;
        return ApiResponse.success(bankTransferService.createDepositReport(effectiveUserId, request));
    }

    @GetMapping
    public ApiResponse<PageResponse<TransferLedgerEntryResponse>> listMyEntries(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long effectiveUserId = userId != null ? userId : 1L;
        return ApiResponse.success(
                bankTransferService.listMyEntries(effectiveUserId, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransferLedgerEntryResponse> getMyEntry(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long id) {
        Long effectiveUserId = userId != null ? userId : 1L;
        return ApiResponse.success(bankTransferService.getMyEntry(effectiveUserId, id));
    }

    @GetMapping("/{id}/receipt")
    public ApiResponse<LedgerReceiptResponse> getReceipt(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long id) {
        Long effectiveUserId = userId != null ? userId : 1L;
        return ApiResponse.success(bankTransferService.getMyReceipt(effectiveUserId, id));
    }
}
