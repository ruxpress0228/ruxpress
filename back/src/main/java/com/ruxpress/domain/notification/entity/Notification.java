package com.ruxpress.domain.notification.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private NotificationChannel channel = NotificationChannel.PUSH;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "data_json", columnDefinition = "TEXT")
    private String dataJson;

    @Column(name = "is_read", nullable = false)
    private boolean readFlag;

    @Enumerated(EnumType.STRING)
    @Column(name = "send_status", nullable = false, length = 16)
    private NotificationSendStatus sendStatus = NotificationSendStatus.PENDING;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static Notification create(
            Long userId,
            NotificationType type,
            String title,
            String body,
            String dataJson) {
        Notification n = new Notification();
        n.userId = userId;
        n.type = type;
        n.title = title;
        n.body = body;
        n.dataJson = dataJson;
        n.channel = NotificationChannel.PUSH;
        n.readFlag = false;
        n.sendStatus = NotificationSendStatus.PENDING;
        n.createdAt = LocalDateTime.now();
        return n;
    }

    public void applyPushDeliveryResult(NotificationSendStatus status, LocalDateTime sentAt) {
        if (this.sendStatus != NotificationSendStatus.PENDING) {
            return;
        }
        this.sendStatus = status;
        this.sentAt = sentAt;
    }
}
