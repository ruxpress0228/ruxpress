package com.ruxpress.push.kafka.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserDeviceSyncEvent(
        UUID eventId,
        Long userId,
        String deviceToken,
        String deviceType,
        Boolean isActive,
        String lastUsedAt,
        String operation
) {
}
