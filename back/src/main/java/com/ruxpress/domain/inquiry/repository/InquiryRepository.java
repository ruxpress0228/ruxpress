package com.ruxpress.domain.inquiry.repository;

import com.ruxpress.domain.inquiry.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Page<Inquiry> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Inquiry> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(com.ruxpress.domain.inquiry.entity.InquiryStatus status);
}
