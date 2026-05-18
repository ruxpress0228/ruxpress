package com.ruxpress.domain.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruxpress.domain.notification.entity.Notification;
import com.ruxpress.domain.notification.entity.NotificationSendStatus;
import com.ruxpress.domain.notification.repository.NotificationRepository;
import com.ruxpress.integration.kafka.dto.PushResultPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPushResultService {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void applyPushResultJson(String json) {
        try {
            PushResultPayload payload = objectMapper.readValue(json, PushResultPayload.class);
            if (payload.notificationId() == null || payload.aggregateStatus() == null) {
                log.warn("push.result missing fields: {}", json);
                return;
            }
            notificationRepository
                    .findById(payload.notificationId())
                    .ifPresentOrElse(
                            n -> apply(n, payload),
                            () -> log.debug("push.result unknown notificationId={}", payload.notificationId()));
        } catch (Exception e) {
            log.warn("push.result parse failed: {}", e.getMessage());
        }
    }

    private void apply(Notification notification, PushResultPayload payload) {
        NotificationSendStatus next =
                "FAILED".equalsIgnoreCase(payload.aggregateStatus())
                        ? NotificationSendStatus.FAILED
                        : NotificationSendStatus.SENT;
        LocalDateTime sentAt = parseSentAt(payload.sentAt());
        notification.applyPushDeliveryResult(next, sentAt);
        notificationRepository.save(notification);
    }

    private static LocalDateTime parseSentAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(raw).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(raw);
            } catch (DateTimeParseException e2) {
                return LocalDateTime.now();
            }
        }
    }
}
