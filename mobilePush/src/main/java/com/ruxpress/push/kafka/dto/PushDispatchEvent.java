package com.ruxpress.push.kafka.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PushDispatchEvent(
        UUID eventId,
        Long notificationId,
        Long userId,
        String type,
        String title,
        String body,
        Object dataJson,
        String createdAt
) {
}
