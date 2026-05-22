package com.ruxpress.domain.banktransfer.repository;

import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SettlementAccountRepository extends JpaRepository<SettlementAccount, Long> {

    List<SettlementAccount> findByActiveTrueAndDeletedAtIsNullOrderByIdAsc();

    Optional<SettlementAccount> findByAccountNumberAndDeletedAtIsNull(String accountNumber);
}
