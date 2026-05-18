package com.ruxpress.push.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruxpress.push.dispatch.PushDispatchHandler;
import com.ruxpress.push.kafka.dto.PushDispatchEvent;
import com.ruxpress.push.kafka.producer.PushKafkaProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PushDispatchKafkaListener {

    private final ObjectMapper objectMapper;
    private final PushDispatchHandler pushDispatchHandler;
    private final PushKafkaProducer pushKafkaProducer;

    @KafkaListener(topics = "${push.kafka.topics.dispatch}", groupId = "ruxpress-push-dispatch")
    public void onMessage(String payload) {
        try {
            PushDispatchEvent event = objectMapper.readValue(payload, PushDispatchEvent.class);
            log.info(
                    "dispatch Kafka message received notificationId={} userId={} type={}",
                    event.notificationId(),
                    event.userId(),
                    event.type());
            pushDispatchHandler.handle(event);
        } catch (Exception e) {
            log.error("Dispatch consume failed: {}", e.getMessage(), e);
            pushKafkaProducer.sendDispatchDlq(payload, e.getMessage());
        }
    }
}
