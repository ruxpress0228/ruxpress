package com.ruxpress.domain.exchange.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.domain.exchange.client.CbrApiClient;
import com.ruxpress.domain.exchange.dto.CurrentExchangeRatesResponse;
import com.ruxpress.domain.exchange.entity.ExchangeRate;
import com.ruxpress.domain.exchange.entity.ExchangeRateSource;
import com.ruxpress.domain.exchange.repository.ExchangeRateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExchangeServiceTest {

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private CbrApiClient cbrApiClient;

    @InjectMocks
    private ExchangeService exchangeService;

    @Test
    void setManual_usd_savesNewCurrentAndClearsPrevious() {
        ExchangeRate previous = ExchangeRate.builder()
                .baseCurrency("USD")
                .targetCurrency("KRW")
                .rate(new BigDecimal("1300"))
                .source(ExchangeRateSource.MANUAL)
                .isCurrent(true)
                .fetchedAt(LocalDateTime.now())
                .build();
        ReflectionTestUtils.setField(previous, "id", 1L);

        when(exchangeRateRepository.findByBaseCurrencyAndIsCurrentTrue("USD")).thenReturn(Optional.of(previous));
        when(exchangeRateRepository.save(any(ExchangeRate.class))).thenAnswer(inv -> inv.getArgument(0));

        exchangeService.setManual("USD", new BigDecimal("1350"), 99L);

        assertThat(previous.getIsCurrent()).isFalse();
        ArgumentCaptor<ExchangeRate> captor = ArgumentCaptor.forClass(ExchangeRate.class);
        verify(exchangeRateRepository).save(captor.capture());
        ExchangeRate saved = captor.getAllValues().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsCurrent()))
                .findFirst()
                .orElseThrow();
        assertThat(saved.getBaseCurrency()).isEqualTo("USD");
        assertThat(saved.getRate()).isEqualByComparingTo("1350");
        assertThat(saved.getSource()).isEqualTo(ExchangeRateSource.MANUAL);
        assertThat(saved.getAdminId()).isEqualTo(99L);
    }

    @Test
    void getCurrentRates_returnsAllCurrentQuotes() {
        ExchangeRate rub = rateRow("RUB", "12.5", 1L);
        ExchangeRate usd = rateRow("USD", "1350", 2L);
        when(exchangeRateRepository.findAllByIsCurrentTrue()).thenReturn(List.of(rub, usd));

        CurrentExchangeRatesResponse response = exchangeService.getCurrentRates();

        assertThat(response.getQuotes()).hasSize(2);
        assertThat(response.getQuotes().stream().map(q -> q.getCurrency()).toList())
                .containsExactlyInAnyOrder("RUB", "USD");
    }

    @Test
    void validateExchangeRateIdForCurrency_rejectsMismatchedCurrency() {
        ExchangeRate rubRate = rateRow("RUB", "12", 10L);
        when(exchangeRateRepository.findById(10L)).thenReturn(Optional.of(rubRate));

        assertThatThrownBy(() -> exchangeService.validateExchangeRateIdForCurrency(10L, "USD"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("일치");
    }

    @Test
    void fetchAndSaveRub_updatesFromCbr() {
        when(cbrApiClient.fetchKrwPerRub()).thenReturn(Optional.of(new BigDecimal("13.2")));
        when(exchangeRateRepository.findByBaseCurrencyAndIsCurrentTrue("RUB")).thenReturn(Optional.empty());
        when(exchangeRateRepository.save(any(ExchangeRate.class))).thenAnswer(inv -> inv.getArgument(0));

        exchangeService.fetchAndSaveRub();

        ArgumentCaptor<ExchangeRate> captor = ArgumentCaptor.forClass(ExchangeRate.class);
        verify(exchangeRateRepository).save(captor.capture());
        ExchangeRate saved = captor.getValue();
        assertThat(saved.getBaseCurrency()).isEqualTo("RUB");
        assertThat(saved.getRate()).isEqualByComparingTo("13.2");
        assertThat(saved.getSource()).isEqualTo(ExchangeRateSource.API);
    }

    @Test
    void fetchAndSaveRub_skipsWhenApiEmpty() {
        when(cbrApiClient.fetchKrwPerRub()).thenReturn(Optional.empty());

        exchangeService.fetchAndSaveRub();

        verify(exchangeRateRepository, never()).save(any());
    }

    private static ExchangeRate rateRow(String base, String rate, Long id) {
        ExchangeRate row = ExchangeRate.builder()
                .baseCurrency(base)
                .targetCurrency("KRW")
                .rate(new BigDecimal(rate))
                .source(ExchangeRateSource.MANUAL)
                .isCurrent(true)
                .fetchedAt(LocalDateTime.now())
                .build();
        ReflectionTestUtils.setField(row, "id", id);
        return row;
    }
}
