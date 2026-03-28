package com.ruxpress.domain.balance.repository;

import com.ruxpress.domain.balance.entity.WalletLedgerEntry;
import com.ruxpress.domain.balance.entity.WalletLedgerEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {

    boolean existsByTransferLedgerEntryId(Long transferLedgerEntryId);

    boolean existsByPurchaseRequestIdAndEntryType(Long purchaseRequestId, WalletLedgerEntryType entryType);

    boolean existsByTransferRefundEntryId(Long transferRefundEntryId);

    Page<WalletLedgerEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
