package com.ruxpress.integration.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ruxpress.config.RuxpressKafkaProperties;
import com.ruxpress.domain.notification.entity.Notification;
import com.ruxpress.domain.user.entity.UserDevice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PushKafkaOutboxService {

    private static final DateTimeFormatter ISO_UTC =
            DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final RuxpressKafkaProperties kafkaProperties;

    public void scheduleDispatchAfterCommit(Notification notification) {
        if (!kafkaProperties.isPublishEvents() || notification.getId() == null) {
            return;
        }
        long id = notification.getId();
        long userId = notification.getUserId();
        String type = notification.getType().name();
        String title = notification.getTitle();
        String body = notification.getBody();
        String dataJson = notification.getDataJson();
        String createdAt = ISO_UTC.format(notification.getCreatedAt().atOffset(ZoneOffset.UTC));
        registerAfterCommit(() -> sendDispatch(id, userId, type, title, body, dataJson, createdAt));
    }

    public void scheduleDeviceSyncAfterCommit(UserDevice device) {
        if (!kafkaProperties.isPublishEvents() || device.getId() == null) {
            return;
        }
        long userId = device.getUserId();
        String token = device.getDeviceToken();
        String deviceType = device.getDeviceType().name();
        boolean active = device.isActive();
        String lastUsedAt = device.getLastUsedAt() == null
                ? null
                : ISO_UTC.format(device.getLastUsedAt().atOffset(ZoneOffset.UTC));
        registerAfterCommit(() -> sendDeviceSync(userId, token, deviceType, active, lastUsedAt));
    }

    private void sendDispatch(long notificationId, long userId, String type,
                              String title, String body, String dataJson, String createdAt) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("eventId", UUID.randomUUID().toString());
            root.put("notificationId", notificationId);
            root.put("userId", userId);
            root.put("type", type);
            root.put("title", title);
            root.put("body", body);
            if (dataJson != null && !dataJson.isBlank()) {
                JsonNode parsed = objectMapper.readTree(dataJson);
                root.set("dataJson", parsed);
            } else {
                root.putNull("dataJson");
            }
            root.put("createdAt", createdAt);
            String json = objectMapper.writeValueAsString(root);
            String topic = kafkaProperties.getTopics().getDispatch();
            kafkaTemplate.send(topic, String.valueOf(userId), json)
                    .whenComplete((r, ex) -> {
                        if (ex != null) {
                            log.warn("Kafka dispatch publish failed topic={} notificationId={}: {}",
                                    topic, notificationId, ex.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.warn("Kafka dispatch serialize/send failed notificationId={}: {}", notificationId, e.getMessage());
        }
    }

    private void sendDeviceSync(long userId, String deviceToken, String deviceType,
                                boolean isActive, String lastUsedAt) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("eventId", UUID.randomUUID().toString());
            root.put("userId", userId);
            root.put("deviceToken", deviceToken);
            root.put("deviceType", deviceType);
            root.put("isActive", isActive);
            if (lastUsedAt != null) {
                root.put("lastUsedAt", lastUsedAt);
            } else {
                root.putNull("lastUsedAt");
            }
            root.put("operation", "UPSERT");
            String json = objectMapper.writeValueAsString(root);
            String topic = kafkaProperties.getTopics().getDeviceSync();
            kafkaTemplate.send(topic, String.valueOf(userId), json)
                    .whenComplete((r, ex) -> {
                        if (ex != null) {
                            log.warn("Kafka device-sync publish failed topic={} userId={}: {}",
                                    topic, userId, ex.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.warn("Kafka device-sync serialize/send failed userId={}: {}", userId, e.getMessage());
        }
    }

    private void registerAfterCommit(Runnable runnable) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            log.warn("No active transaction; running Kafka publish immediately");
            runnable.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        runnable.run();
                    }
                });
    }
}
