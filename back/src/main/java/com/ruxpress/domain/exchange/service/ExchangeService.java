package com.ruxpress.domain.exchange.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.exchange.client.CbrApiClient;
import com.ruxpress.domain.exchange.dto.CurrentExchangeRatesResponse;
import com.ruxpress.domain.exchange.dto.ExchangeRateResponse;
import com.ruxpress.domain.exchange.entity.ExchangeRate;
import com.ruxpress.domain.exchange.entity.ExchangeRateSource;
import com.ruxpress.domain.exchange.entity.QuoteCurrency;
import com.ruxpress.domain.exchange.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeService {

    private static final String TARGET_CURRENCY = "KRW";

    private final ExchangeRateRepository exchangeRateRepository;
    private final CbrApiClient cbrApiClient;

    @Transactional
    public void fetchAndSave() {
        fetchAndSaveRub();
    }

    @Transactional
    public void fetchAndSaveRub() {
        Optional<BigDecimal> optRate = cbrApiClient.fetchKrwPerRub();
        if (optRate.isEmpty()) {
            return;
        }
        saveCurrentRate(QuoteCurrency.RUB.name(), optRate.get(), ExchangeRateSource.API, null);
        log.info("Exchange rate updated from API: 1 RUB = {} KRW", optRate.get());
    }

    @Transactional
    public void setManual(String currencyCode, BigDecimal rate, Long adminId) {
        QuoteCurrency currency = QuoteCurrency.fromCode(currencyCode);
        saveCurrentRate(currency.name(), rate, ExchangeRateSource.MANUAL, adminId);
        log.info("Exchange rate set manually by admin {}: 1 {} = {} KRW", adminId, currency.name(), rate);
    }

    private void saveCurrentRate(String baseCurrency, BigDecimal rate, ExchangeRateSource source, Long adminId) {
        Optional<ExchangeRate> currentOpt = exchangeRateRepository.findByBaseCurrencyAndIsCurrentTrue(baseCurrency);
        if (currentOpt.isPresent()) {
            ExchangeRate current = currentOpt.get();
            if (current.getRate().compareTo(rate) == 0 && current.getSource() == source) {
                return;
            }
            current.setCurrent(false);
            exchangeRateRepository.save(current);
        }
        ExchangeRate entity = ExchangeRate.builder()
                .baseCurrency(baseCurrency)
                .targetCurrency(TARGET_CURRENCY)
                .rate(rate)
                .source(source)
                .adminId(adminId)
                .isCurrent(true)
                .fetchedAt(LocalDateTime.now())
                .build();
        exchangeRateRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public CurrentExchangeRatesResponse getCurrentRates() {
        List<ExchangeRate> currents = exchangeRateRepository.findAllByIsCurrentTrue();
        if (currents.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "환율 정보가 없습니다");
        }
        return CurrentExchangeRatesResponse.from(currents);
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeRate> getCurrentForCurrency(String currencyCode) {
        if (currencyCode == null || "KRW".equalsIgnoreCase(currencyCode)) {
            return Optional.empty();
        }
        QuoteCurrency currency = QuoteCurrency.fromCode(currencyCode);
        return exchangeRateRepository.findByBaseCurrencyAndIsCurrentTrue(currency.name());
    }

    @Transactional(readOnly = true)
    public void validateExchangeRateIdForCurrency(Long exchangeRateId, String quoteCurrency) {
        if (exchangeRateId == null) {
            return;
        }
        if (quoteCurrency == null || "KRW".equalsIgnoreCase(quoteCurrency)) {
            return;
        }
        QuoteCurrency expected = QuoteCurrency.fromCode(quoteCurrency);
        ExchangeRate rate = exchangeRateRepository.findById(exchangeRateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT, "유효하지 않은 환율 ID입니다."));
        if (!Boolean.TRUE.equals(rate.getIsCurrent())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "현재 적용 환율이 아닙니다.");
        }
        if (!expected.name().equals(rate.getBaseCurrency())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "선택 통화와 환율 ID가 일치하지 않습니다.");
        }
    }

    @Transactional(readOnly = true)
    public Page<ExchangeRateResponse> getHistory(String baseCurrency, Pageable pageable) {
        Page<ExchangeRate> page = (baseCurrency != null && !baseCurrency.isBlank())
                ? exchangeRateRepository.findByBaseCurrencyOrderByFetchedAtDesc(
                        QuoteCurrency.fromCode(baseCurrency).name(), pageable)
                : exchangeRateRepository.findAllByOrderByFetchedAtDesc(pageable);
        return page.map(ExchangeRateResponse::from);
    }
}
