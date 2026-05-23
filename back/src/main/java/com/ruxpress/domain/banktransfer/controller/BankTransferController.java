package com.ruxpress.domain.banktransfer.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.banktransfer.dto.request.DepositReportRequest;
import com.ruxpress.domain.banktransfer.dto.response.LedgerReceiptResponse;
import com.ruxpress.domain.banktransfer.dto.response.SettlementAccountResponse;
import com.ruxpress.domain.banktransfer.dto.response.TransferLedgerEntryResponse;
import com.ruxpress.domain.banktransfer.service.BankTransferNoticeService;
import com.ruxpress.domain.banktransfer.service.BankTransferService;
import jakarta.servlet.http.HttpServletRequest;
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
            HttpServletRequest request,
            @Valid @RequestBody DepositReportRequest requestBody) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(bankTransferService.createDepositReport(userId, requestBody));
    }

    @PostMapping(value = "/deposit-reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TransferLedgerEntryResponse> createDepositReportWithFiles(
            HttpServletRequest request,
            @RequestPart("report") @Valid DepositReportRequest report,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(bankTransferService.createDepositReport(userId, report, files));
    }

    @GetMapping
    public ApiResponse<PageResponse<TransferLedgerEntryResponse>> listMyEntries(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(
                bankTransferService.listMyEntries(userId, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransferLedgerEntryResponse> getMyEntry(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(bankTransferService.getMyEntry(userId, id));
    }

    @GetMapping("/{id}/receipt")
    public ApiResponse<LedgerReceiptResponse> getReceipt(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = resolveUserId(request);
        return ApiResponse.success(bankTransferService.getMyReceipt(userId, id));
    }

    private Long resolveUserId(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return userId;
    }
}
