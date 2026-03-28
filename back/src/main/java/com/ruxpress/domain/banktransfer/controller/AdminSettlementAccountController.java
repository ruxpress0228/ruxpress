package com.ruxpress.domain.banktransfer.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.banktransfer.dto.request.SettlementAccountCreateRequest;
import com.ruxpress.domain.banktransfer.dto.request.SettlementAccountUpdateRequest;
import com.ruxpress.domain.banktransfer.dto.response.SettlementAccountResponse;
import com.ruxpress.domain.banktransfer.service.SettlementAccountAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/settlement-accounts")
@RequiredArgsConstructor
public class AdminSettlementAccountController {

    private final SettlementAccountAdminService settlementAccountAdminService;

    @GetMapping
    public ApiResponse<List<SettlementAccountResponse>> list() {
        return ApiResponse.success(settlementAccountAdminService.listAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<SettlementAccountResponse> get(@PathVariable Long id) {
        return ApiResponse.success(settlementAccountAdminService.getById(id));
    }

    @PostMapping
    public ApiResponse<SettlementAccountResponse> create(
            Authentication auth,
            @Valid @RequestBody SettlementAccountCreateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(settlementAccountAdminService.create(adminId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<SettlementAccountResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SettlementAccountUpdateRequest request) {
        return ApiResponse.success(settlementAccountAdminService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        settlementAccountAdminService.softDelete(id);
        return ApiResponse.success(null);
    }
}
