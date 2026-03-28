package com.ruxpress.domain.banktransfer.repository;

import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface TransferLedgerEntryRepository
        extends JpaRepository<TransferLedgerEntry, Long>, JpaSpecificationExecutor<TransferLedgerEntry> {

    Optional<TransferLedgerEntry> findByIdempotencyKey(String idempotencyKey);

    Page<TransferLedgerEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<TransferLedgerEntry> findByIdAndUserId(Long id, Long userId);

    boolean existsByParentEntryIdAndEntryTypeAndStatus(
            Long parentEntryId,
            TransferLedgerEntryType entryType,
            TransferLedgerStatus status);

    List<TransferLedgerEntry> findByParentEntryId(Long parentEntryId);
}
