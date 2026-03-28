package com.ruxpress.domain.banktransfer.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.banktransfer.dto.request.AdminMemoRequest;
import com.ruxpress.domain.banktransfer.dto.request.SettlementOrRefundRequest;
import com.ruxpress.domain.banktransfer.dto.response.TransferLedgerEntryResponse;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import com.ruxpress.domain.banktransfer.service.BankTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/bank-transfers")
@RequiredArgsConstructor
public class AdminBankTransferController {

    private final BankTransferService bankTransferService;

    @GetMapping
    public ApiResponse<PageResponse<TransferLedgerEntryResponse>> list(
            @RequestParam(required = false) TransferLedgerStatus status,
            @RequestParam(required = false) TransferLedgerEntryType entryType,
            @RequestParam(required = false) String userEmail,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(
                bankTransferService.listForAdmin(status, entryType, userEmail, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransferLedgerEntryResponse> get(@PathVariable Long id) {
        return ApiResponse.success(bankTransferService.getForAdmin(id));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<TransferLedgerEntryResponse> confirm(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody(required = false) AdminMemoRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(bankTransferService.confirmDeposit(adminId, id, request));
    }

    @PostMapping("/{parentId}/settlement")
    public ApiResponse<TransferLedgerEntryResponse> settle(
            Authentication auth,
            @PathVariable Long parentId,
            @Valid @RequestBody SettlementOrRefundRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(bankTransferService.settle(adminId, parentId, request));
    }

    @PostMapping("/{parentId}/refund")
    public ApiResponse<TransferLedgerEntryResponse> refund(
            Authentication auth,
            @PathVariable Long parentId,
            @Valid @RequestBody SettlementOrRefundRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(bankTransferService.refund(adminId, parentId, request));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<TransferLedgerEntryResponse> cancelPending(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody(required = false) AdminMemoRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(bankTransferService.cancelPending(adminId, id, request));
    }
}
