package com.ruxpress.push.kafka.dto;

import java.time.Instant;
import java.util.UUID;

public record PushResultEvent(
        UUID eventId,
        Long notificationId,
        String aggregateStatus,
        Instant sentAt,
        String failureReason
) {
}
