package com.ruxpress.domain.notice.repository;

import com.ruxpress.domain.notice.entity.Notice;
import com.ruxpress.domain.notice.entity.NoticeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    Page<Notice> findByDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(Pageable pageable);

    Page<Notice> findByStatusAndDeletedAtIsNullOrderByIsPinnedDescPublishedAtDesc(
            NoticeStatus status, Pageable pageable);

    List<Notice> findByStatusAndPublishedAtBeforeAndDeletedAtIsNull(
            NoticeStatus status, LocalDateTime now);

    long countByDeletedAtIsNull();
}
