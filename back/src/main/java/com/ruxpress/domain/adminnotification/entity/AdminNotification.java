package com.ruxpress.domain.adminnotification.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "admin_notifications", indexes = {
        @Index(name = "idx_admin_notif_admin_created", columnList = "admin_id, created_at"),
        @Index(name = "idx_admin_notif_admin_read", columnList = "admin_id, is_read")
})
public class AdminNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AdminNotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_json")
    private String dataJson;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "is_read", nullable = false)
    private boolean readFlag;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static AdminNotification create(
            Long adminId,
            AdminNotificationType type,
            String title,
            String body,
            String dataJson,
            String linkUrl) {
        AdminNotification n = new AdminNotification();
        n.adminId = adminId;
        n.type = type;
        n.title = title;
        n.body = body;
        n.dataJson = dataJson;
        n.linkUrl = linkUrl;
        n.readFlag = false;
        n.createdAt = LocalDateTime.now();
        return n;
    }

    public void markRead() {
        if (this.readFlag) {
            return;
        }
        this.readFlag = true;
        this.readAt = LocalDateTime.now();
    }
}
