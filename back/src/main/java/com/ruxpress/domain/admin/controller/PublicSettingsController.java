package com.ruxpress.domain.admin.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.admin.entity.SystemSetting;
import com.ruxpress.domain.admin.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/**
 * 인증 불필요 공개 설정 조회. /api/v1/admin/** 패턴에 걸리지 않도록 URL을 분리했다.
 */
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class PublicSettingsController {

    private static final String FEE_RATE_KEY = "fee_rate";
    private static final String DEFAULT_FEE_RATE = "12";

    private final SystemSettingRepository repository;

    @GetMapping("/fee-rate")
    public ApiResponse<FeeRateResponse> getFeeRate() {
        String value = repository.findBySettingKey(FEE_RATE_KEY)
                .map(SystemSetting::getSettingValue)
                .orElse(DEFAULT_FEE_RATE);
        BigDecimal parsed;
        try {
            parsed = new BigDecimal(value);
        } catch (NumberFormatException e) {
            parsed = new BigDecimal(DEFAULT_FEE_RATE);
        }
        return ApiResponse.success(new FeeRateResponse(parsed));
    }

    public record FeeRateResponse(BigDecimal feeRatePercent) {
    }
}
