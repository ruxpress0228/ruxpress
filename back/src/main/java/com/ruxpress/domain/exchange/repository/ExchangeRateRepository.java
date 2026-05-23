package com.ruxpress.domain.exchange.repository;

import com.ruxpress.domain.exchange.entity.ExchangeRate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    Optional<ExchangeRate> findByIsCurrentTrue();

    Optional<ExchangeRate> findByBaseCurrencyAndIsCurrentTrue(String baseCurrency);

    List<ExchangeRate> findAllByIsCurrentTrue();

    Page<ExchangeRate> findAllByOrderByFetchedAtDesc(Pageable pageable);

    Page<ExchangeRate> findByBaseCurrencyOrderByFetchedAtDesc(String baseCurrency, Pageable pageable);
}
