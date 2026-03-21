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

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private static final String FEE_RATE_KEY = "fee_rate";
    private static final String FEE_CATEGORY = "FEE";
    private static final String DEFAULT_FEE_RATE = "12";

    private final SystemSettingRepository repository;

    @GetMapping("/fee-rate")
    public ApiResponse<SettingResponse> getFeeRate() {
        SystemSetting setting = repository.findBySettingKey(FEE_RATE_KEY).orElse(null);
        if (setting == null) {
            return ApiResponse.success(new SettingResponse(null, FEE_CATEGORY, FEE_RATE_KEY, DEFAULT_FEE_RATE, "수수료율(%)", null, null));
        }
        return ApiResponse.success(SettingResponse.from(setting));
    }

    @PutMapping("/fee-rate")
    public ApiResponse<SettingResponse> updateFeeRate(
            Authentication auth,
            @Valid @RequestBody SettingUpdateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        SystemSetting setting = repository.findBySettingKey(FEE_RATE_KEY)
                .orElseGet(() -> SystemSetting.create(FEE_CATEGORY, FEE_RATE_KEY, request.getValue(), "수수료율(%)", adminId));
        setting.updateValue(request.getValue(), adminId);
        repository.save(setting);
        return ApiResponse.success(SettingResponse.from(setting));
    }

    @GetMapping("/templates")
    public ApiResponse<List<SettingResponse>> getTemplates() {
        List<SettingResponse> list = repository.findByCategoryOrderBySettingKeyAsc("TEMPLATE")
                .stream().map(SettingResponse::from).collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping("/templates")
    public ApiResponse<SettingResponse> createTemplate(
            Authentication auth,
            @Valid @RequestBody SettingUpdateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        SystemSetting setting = SystemSetting.create("TEMPLATE", request.getKey(), request.getValue(), request.getDescription(), adminId);
        repository.save(setting);
        return ApiResponse.success(SettingResponse.from(setting));
    }

    @PutMapping("/templates/{id}")
    public ApiResponse<SettingResponse> updateTemplate(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody SettingUpdateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        SystemSetting setting = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("설정을 찾을 수 없습니다"));
        setting.updateValue(request.getValue(), adminId);
        repository.save(setting);
        return ApiResponse.success(SettingResponse.from(setting));
    }

    @DeleteMapping("/templates/{id}")
    public ApiResponse<Void> deleteTemplate(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success(null);
    }
}
