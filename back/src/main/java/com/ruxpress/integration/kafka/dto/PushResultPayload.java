package com.ruxpress.integration.kafka.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PushResultPayload(
        String eventId,
        Long notificationId,
        String aggregateStatus,
        String sentAt,
        String failureReason) {}
