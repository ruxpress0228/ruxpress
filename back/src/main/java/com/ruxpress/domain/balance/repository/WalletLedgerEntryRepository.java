package com.ruxpress.domain.balance.repository;

import com.ruxpress.domain.balance.entity.WalletLedgerEntry;
import com.ruxpress.domain.balance.entity.WalletLedgerEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<WalletLedgerEntry> findByPurchaseRequestIdAndEntryType(
            Long purchaseRequestId,
            WalletLedgerEntryType entryType);

    @Query("select coalesce(sum(e.amount), 0) from WalletLedgerEntry e where e.purchaseRequestId = :pid and e.entryType = :type")
    BigDecimal sumAmountByPurchaseAndType(
            @Param("pid") Long purchaseRequestId,
            @Param("type") WalletLedgerEntryType type);

    Page<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
