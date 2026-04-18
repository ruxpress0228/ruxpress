package com.ruxpress.push.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruxpress.push.device.PushDeviceSyncService;
import com.ruxpress.push.kafka.dto.UserDeviceSyncEvent;
import com.ruxpress.push.kafka.producer.PushKafkaProducer;
import com.ruxpress.push.util.LogTokens;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeviceSyncKafkaListener {

    private final ObjectMapper objectMapper;
    private final PushDeviceSyncService pushDeviceSyncService;
    private final PushKafkaProducer pushKafkaProducer;

    @KafkaListener(topics = "${push.kafka.topics.device-sync}", groupId = "ruxpress-push-device")
    public void onMessage(String payload) {
        try {
            UserDeviceSyncEvent event = objectMapper.readValue(payload, UserDeviceSyncEvent.class);
            log.info(
                    "device-sync Kafka message received eventId={} userId={} deviceType={} operation={} token={}",
                    event.eventId(),
                    event.userId(),
                    event.deviceType(),
                    event.operation(),
                    LogTokens.maskDeviceToken(event.deviceToken()));
            pushDeviceSyncService.apply(event);
        } catch (Exception e) {
            log.error("Device sync consume failed: {}", e.getMessage(), e);
            pushKafkaProducer.sendDeviceSyncDlq(payload, "device-sync: " + e.getMessage());
        }
    }
}
