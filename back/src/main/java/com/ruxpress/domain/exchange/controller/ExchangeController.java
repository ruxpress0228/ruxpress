package com.ruxpress.domain.exchange.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.exchange.dto.CurrentExchangeRateResponse;
import com.ruxpress.domain.exchange.dto.ExchangeRateResponse;
import com.ruxpress.domain.exchange.dto.ManualExchangeRateRequest;
import com.ruxpress.domain.exchange.service.ExchangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/exchange-rates")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;

    @GetMapping("/current")
    public ApiResponse<CurrentExchangeRateResponse> getCurrent() {
        return exchangeService.getCurrent()
                .map(ApiResponse::success)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "환율 정보가 없습니다"));
    }

    @GetMapping
    public ApiResponse<Page<ExchangeRateResponse>> getHistory(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExchangeRateResponse> page = exchangeService.getHistory(pageable);
        return ApiResponse.success(page);
    }

    @PostMapping("/fetch")
    public ApiResponse<CurrentExchangeRateResponse> triggerFetch() {
        exchangeService.fetchAndSave();
        return exchangeService.getCurrent()
                .map(ApiResponse::success)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "환율 정보가 없습니다"));
    }

    @PostMapping("/manual")
    public ApiResponse<CurrentExchangeRateResponse> setManual(
            @Valid @RequestBody ManualExchangeRateRequest request) {
        Long adminId = null; // TODO: from SecurityContext when admin auth is implemented
        exchangeService.setManual(request.getRate(), adminId);
        return exchangeService.getCurrent()
                .map(ApiResponse::success)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "환율 정보가 없습니다"));
    }
}
