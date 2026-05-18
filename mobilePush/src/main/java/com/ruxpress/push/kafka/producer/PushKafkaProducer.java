package com.ruxpress.push.kafka.producer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruxpress.push.config.PushKafkaProperties;
import com.ruxpress.push.kafka.dto.PushResultEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PushKafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final PushKafkaProperties pushKafkaProperties;

    public void sendResult(PushResultEvent event) {
        String topic = pushKafkaProperties.getTopics().getResult();
        try {
            String json = objectMapper.writeValueAsString(new ResultPayload(
                    event.eventId().toString(),
                    event.notificationId(),
                    event.aggregateStatus(),
                    event.sentAt() != null ? event.sentAt().toString() : null,
                    event.failureReason()));
            kafkaTemplate
                    .send(topic, String.valueOf(event.notificationId()), json)
                    .whenComplete(
                            (r, ex) -> {
                                if (ex != null) {
                                    log.warn(
                                            "Kafka publish failed topic={} notificationId={}: {}",
                                            topic,
                                            event.notificationId(),
                                            ex.getMessage());
                                } else {
                                    log.debug(
                                            "Published push result notificationId={} status={}",
                                            event.notificationId(),
                                            event.aggregateStatus());
                                }
                            });
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize PushResultEvent", e);
        }
    }

    public void sendDispatchDlq(String rawJson, String reason) {
        sendDlq(pushKafkaProperties.getTopics().getDispatchDlq(), rawJson, reason);
    }

    public void sendDeviceSyncDlq(String rawJson, String reason) {
        sendDlq(pushKafkaProperties.getTopics().getDeviceSyncDlq(), rawJson, reason);
    }

    private void sendDlq(String topic, String rawJson, String reason) {
        try {
            String json = objectMapper.writeValueAsString(new DlqPayload(rawJson, reason));
            kafkaTemplate
                    .send(topic, json)
                    .whenComplete(
                            (r, ex) -> {
                                if (ex != null) {
                                    log.warn("Kafka DLQ publish failed topic={}: {}", topic, ex.getMessage());
                                }
                            });
        } catch (JsonProcessingException e) {
            log.error("Failed to send DLQ", e);
        }
    }

    private record ResultPayload(
            String eventId,
            Long notificationId,
            String aggregateStatus,
            String sentAt,
            String failureReason
    ) {
    }

    private record DlqPayload(String originalMessage, String reason) {
    }
}
