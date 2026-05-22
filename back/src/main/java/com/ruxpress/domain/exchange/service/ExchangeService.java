package com.ruxpress.domain.exchange.service;

import com.ruxpress.domain.exchange.client.CbrApiClient;
import com.ruxpress.domain.exchange.dto.CurrentExchangeRateResponse;
import com.ruxpress.domain.exchange.dto.ExchangeRateResponse;
import com.ruxpress.domain.exchange.entity.ExchangeRate;
import com.ruxpress.domain.exchange.entity.ExchangeRateSource;
import com.ruxpress.domain.exchange.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeService {

    private static final String BASE_CURRENCY = "RUB";
    private static final String TARGET_CURRENCY = "KRW";

    private final ExchangeRateRepository exchangeRateRepository;
    private final CbrApiClient cbrApiClient;

    /**
     * 외부 환율 자동 fetch는 비활성화 상태(REQ-10). 관리자 화면의 "API에서 새로고침" 버튼이
     * /api/v1/exchange-rates/fetch 로 호출할 때만 1회성으로 실행된다.
     */
    @Transactional
    public void fetchAndSave() {
        Optional<BigDecimal> optRate = cbrApiClient.fetchKrwPerRub();
        if (optRate.isEmpty()) {
            return;
        }
        BigDecimal newRate = optRate.get();
        Optional<ExchangeRate> currentOpt = exchangeRateRepository.findByIsCurrentTrue();
        if (currentOpt.isPresent()) {
            ExchangeRate current = currentOpt.get();
            if (current.getRate().compareTo(newRate) == 0) {
                return;
            }
            current.setCurrent(false);
            exchangeRateRepository.save(current);
        }
        ExchangeRate entity = ExchangeRate.builder()
                .baseCurrency(BASE_CURRENCY)
                .targetCurrency(TARGET_CURRENCY)
                .rate(newRate)
                .source(ExchangeRateSource.API)
                .adminId(null)
                .isCurrent(true)
                .fetchedAt(LocalDateTime.now())
                .build();
        exchangeRateRepository.save(entity);
        log.info("Exchange rate updated from API: 1 {} = {} {}", BASE_CURRENCY, newRate, TARGET_CURRENCY);
    }

    @Transactional
    public void setManual(BigDecimal rate, Long adminId) {
        exchangeRateRepository.findByIsCurrentTrue().ifPresent(current -> {
            current.setCurrent(false);
            exchangeRateRepository.save(current);
        });
        ExchangeRate entity = ExchangeRate.builder()
                .baseCurrency(BASE_CURRENCY)
                .targetCurrency(TARGET_CURRENCY)
                .rate(rate)
                .source(ExchangeRateSource.MANUAL)
                .adminId(adminId)
                .isCurrent(true)
                .fetchedAt(LocalDateTime.now())
                .build();
        exchangeRateRepository.save(entity);
        log.info("Exchange rate set manually by admin {}: 1 {} = {} {}", adminId, BASE_CURRENCY, rate, TARGET_CURRENCY);
    }

    @Transactional(readOnly = true)
    public Optional<CurrentExchangeRateResponse> getCurrent() {
        return exchangeRateRepository.findByIsCurrentTrue()
                .map(CurrentExchangeRateResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<ExchangeRateResponse> getHistory(Pageable pageable) {
        return exchangeRateRepository.findAllByOrderByFetchedAtDesc(pageable)
                .map(ExchangeRateResponse::from);
    }
}
