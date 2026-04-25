package com.ruxpress.integration.kafka;

import com.ruxpress.domain.notification.service.NotificationPushResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PushResultKafkaListener {

    private final NotificationPushResultService notificationPushResultService;

    @KafkaListener(
            topics = "${ruxpress.kafka.topics.result}",
            groupId = "ruxpress-back-push-result",
            autoStartup = "${ruxpress.kafka.consume-results:false}")
    public void onMessage(String payload) {
        try {
            notificationPushResultService.applyPushResultJson(payload);
        } catch (Exception e) {
            log.error("push.result consume failed: {}", e.getMessage(), e);
        }
    }
}
