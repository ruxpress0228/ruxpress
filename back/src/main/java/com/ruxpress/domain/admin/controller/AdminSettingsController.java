package com.ruxpress.domain.admin.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.admin.dto.request.SettingUpdateRequest;
import com.ruxpress.domain.admin.dto.response.SettingResponse;
import com.ruxpress.domain.admin.entity.SystemSetting;
import com.ruxpress.domain.admin.repository.SystemSettingRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private static final String FEE_RATE_KEY = "fee_rate";
    private static final String DEFAULT_FEE_RATE = "12";

    private final SystemSettingRepository repository;

    @GetMapping("/fee-rate")
    public ApiResponse<SettingResponse> getFeeRate() {
        SystemSetting setting = repository.findById(FEE_RATE_KEY).orElse(null);
        if (setting == null) {
            return ApiResponse.success(new SettingResponse(FEE_RATE_KEY, DEFAULT_FEE_RATE, null, null));
        }
        return ApiResponse.success(new SettingResponse(
                setting.getSettingKey(), setting.getSettingValue(),
                setting.getUpdatedBy(), setting.getUpdatedAt()));
    }

    @PutMapping("/fee-rate")
    public ApiResponse<SettingResponse> updateFeeRate(
            Authentication auth,
            @Valid @RequestBody SettingUpdateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        SystemSetting setting = repository.findById(FEE_RATE_KEY)
                .orElseGet(() -> SystemSetting.create(FEE_RATE_KEY, request.getValue(), adminId));
        setting.updateValue(request.getValue(), adminId);
        repository.save(setting);
        return ApiResponse.success(new SettingResponse(
                setting.getSettingKey(), setting.getSettingValue(),
                setting.getUpdatedBy(), setting.getUpdatedAt()));
    }
}
