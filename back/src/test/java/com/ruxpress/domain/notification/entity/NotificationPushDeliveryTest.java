package com.ruxpress.domain.notification.entity;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationPushDeliveryTest {

    @Test
    void applyPushDeliveryResult_updatesOnlyWhenPending() {
        Notification n =
                Notification.create(1L, NotificationType.BANK_DEPOSIT, "t", "b", "{\"x\":1}");
        ReflectionTestUtils.setField(n, "id", 99L);
        LocalDateTime sent = LocalDateTime.of(2026, 3, 28, 12, 0);

        n.applyPushDeliveryResult(NotificationSendStatus.SENT, sent);
        assertThat(n.getSendStatus()).isEqualTo(NotificationSendStatus.SENT);
        assertThat(n.getSentAt()).isEqualTo(sent);

        n.applyPushDeliveryResult(NotificationSendStatus.FAILED, LocalDateTime.now());
        assertThat(n.getSendStatus()).isEqualTo(NotificationSendStatus.SENT);
    }
}
