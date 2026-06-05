package com.ruxpress.domain.exchange.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.exchange.dto.CurrentExchangeRatesResponse;
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
    public ApiResponse<CurrentExchangeRatesResponse> getCurrent() {
        return ApiResponse.success(exchangeService.getCurrentRates());
    }

    @GetMapping
    public ApiResponse<Page<ExchangeRateResponse>> getHistory(
            @RequestParam(required = false) String baseCurrency,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExchangeRateResponse> page = exchangeService.getHistory(baseCurrency, pageable);
        return ApiResponse.success(page);
    }

    @PostMapping("/fetch")
    public ApiResponse<CurrentExchangeRatesResponse> triggerFetch() {
        exchangeService.fetchAndSave();
        return ApiResponse.success(exchangeService.getCurrentRates());
    }

    @PostMapping("/manual")
    public ApiResponse<CurrentExchangeRatesResponse> setManual(
            @Valid @RequestBody ManualExchangeRateRequest request) {
        Long adminId = null; // TODO: from SecurityContext when admin auth is implemented
        exchangeService.setManual(request.getCurrency(), request.getRate(), adminId);
        return ApiResponse.success(exchangeService.getCurrentRates());
    }
}
