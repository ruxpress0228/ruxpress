package com.ruxpress.domain.banktransfer.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.banktransfer.dto.request.DepositReportRequest;
import com.ruxpress.domain.banktransfer.dto.response.LedgerReceiptResponse;
import com.ruxpress.domain.banktransfer.dto.response.SettlementAccountResponse;
import com.ruxpress.domain.banktransfer.dto.response.TransferLedgerEntryResponse;
import com.ruxpress.domain.banktransfer.service.BankTransferNoticeService;
import com.ruxpress.domain.banktransfer.service.BankTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bank-transfers")
@RequiredArgsConstructor
public class BankTransferController {

    private final BankTransferService bankTransferService;
    private final BankTransferNoticeService bankTransferNoticeService;

    @GetMapping("/settlement-accounts")
    public ApiResponse<List<SettlementAccountResponse>> listSettlementAccounts() {
        return ApiResponse.success(bankTransferService.listActiveSettlementAccountsForUser());
    }

    @GetMapping("/notice-images")
    public ApiResponse<List<AttachmentResponse>> listNoticeImages() {
        return ApiResponse.success(bankTransferNoticeService.list());
    }

    @PostMapping(value = "/deposit-reports", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<TransferLedgerEntryResponse> createDepositReport(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody DepositReportRequest request) {
        Long effectiveUserId = userId != null ? userId : 1L;
        return ApiResponse.success(bankTransferService.createDepositReport(effectiveUserId, request));
    }

    @PostMapping(value = "/deposit-reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TransferLedgerEntryResponse> createDepositReportWithFiles(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestPart("report") @Valid DepositReportRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        Long effectiveUserId = userId != null ? userId : 1L;
        return ApiResponse.success(bankTransferService.createDepositReport(effectiveUserId, request, files));
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
