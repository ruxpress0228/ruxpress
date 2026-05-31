package com.ruxpress.domain.banktransfer.repository;

import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
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

    @Query("""
            SELECT e.parentEntryId, COALESCE(SUM(e.amount), 0)
            FROM TransferLedgerEntry e
            WHERE e.parentEntryId IN :parentIds
              AND e.status = com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus.CONFIRMED
              AND e.entryType IN (
                  com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType.SETTLEMENT,
                  com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType.REFUND)
            GROUP BY e.parentEntryId
            """)
    List<Object[]> sumConfirmedSettleOrRefundByParentIds(@Param("parentIds") Collection<Long> parentIds);
}
