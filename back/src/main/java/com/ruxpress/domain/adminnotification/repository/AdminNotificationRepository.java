package com.ruxpress.domain.adminnotification.repository;

import com.ruxpress.domain.adminnotification.entity.AdminNotification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    long countByAdminIdAndReadFlagFalse(Long adminId);

    List<AdminNotification> findByAdminIdOrderByCreatedAtDesc(Long adminId, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE AdminNotification n SET n.readFlag = true, n.readAt = :now " +
            "WHERE n.adminId = :adminId AND n.readFlag = false")
    int markAllReadByAdminId(@Param("adminId") Long adminId, @Param("now") LocalDateTime now);
}
