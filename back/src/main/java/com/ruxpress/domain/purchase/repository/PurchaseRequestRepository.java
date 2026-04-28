package com.ruxpress.domain.purchase.repository;

import com.ruxpress.domain.purchase.entity.PurchaseRequest;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

    Page<PurchaseRequest> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    Page<PurchaseRequest> findByUserIdAndStatusAndDeletedAtIsNull(
            Long userId,
            PurchaseRequestStatus status,
            Pageable pageable
    );

    List<PurchaseRequest> findTop3ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    Page<PurchaseRequest> findByDeletedAtIsNull(Pageable pageable);

    Page<PurchaseRequest> findByStatusAndDeletedAtIsNull(PurchaseRequestStatus status, Pageable pageable);
}
