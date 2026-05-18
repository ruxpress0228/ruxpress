package com.ruxpress.push.dispatch;

import com.ruxpress.push.domain.PushDeliveryAttempt;
import com.ruxpress.push.domain.PushDeliveryAttemptRepository;
import com.ruxpress.push.domain.PushDevice;
import com.ruxpress.push.domain.PushDeviceRepository;
import com.ruxpress.push.kafka.dto.PushDispatchEvent;
import com.ruxpress.push.kafka.dto.PushResultEvent;
import com.ruxpress.push.kafka.producer.PushKafkaProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushDispatchHandler {

    private static final List<String> PUSH_TYPES = List.of("ANDROID", "IOS");

    private final PushDeviceRepository pushDeviceRepository;
    private final PushDeliveryAttemptRepository deliveryAttemptRepository;
    private final FcmDispatchService fcmDispatchService;
    private final PushKafkaProducer pushKafkaProducer;

    @Transactional
    public void handle(PushDispatchEvent event) {
        if (event.notificationId() == null || event.userId() == null) {
            log.warn("Invalid dispatch event: {}", event);
            return;
        }

        List<PushDevice> devices = pushDeviceRepository.findByUserIdAndActiveTrueAndDeviceTypeIn(
                event.userId(), PUSH_TYPES);

        log.info(
                "dispatch handling notificationId={} userId={} title={} activeDevices={}",
                event.notificationId(),
                event.userId(),
                event.title(),
                devices.size());

        if (devices.isEmpty()) {
            log.info("No active push devices for userId={} notificationId={}", event.userId(), event.notificationId());
            safeSendResult(
                    new PushResultEvent(
                            UUID.randomUUID(),
                            event.notificationId(),
                            "FAILED",
                            Instant.now(),
                            "NO_DEVICE"));
            return;
        }

        int ok = 0;
        int fail = 0;
        for (PushDevice d : devices) {
            try {
                String msgId = fcmDispatchService.sendToToken(d.getDeviceToken(), event.title(), event.body(), event.dataJson());
                deliveryAttemptRepository.save(PushDeliveryAttempt.builder()
                        .notificationId(event.notificationId())
                        .userId(event.userId())
                        .deviceTokenPrefix(prefix(d.getDeviceToken()))
                        .provider("FCM")
                        .status(msgId != null ? "SUCCESS" : "SKIPPED")
                        .providerMessageId(msgId)
                        .build());
                if (msgId != null) {
                    ok++;
                } else {
                    ok++; // skipped but not error (FCM off)
                }
            } catch (FcmDispatchService.FcmSendException ex) {
                fail++;
                deliveryAttemptRepository.save(PushDeliveryAttempt.builder()
                        .notificationId(event.notificationId())
                        .userId(event.userId())
                        .deviceTokenPrefix(prefix(d.getDeviceToken()))
                        .provider("FCM")
                        .status("ERROR")
                        .errorDetail(ex.getErrorCode() + ": " + ex.getMessage())
                        .build());
                if ("UNREGISTERED".equals(ex.getErrorCode()) || "INVALID_ARGUMENT".equals(ex.getErrorCode())) {
                    d.setActive(false);
                    pushDeviceRepository.save(d);
                }
            }
        }

        String aggregate = fail == 0 ? "SENT" : (ok > 0 ? "SENT" : "FAILED");
        log.info(
                "dispatch done notificationId={} userId={} aggregate={} fcmOk={} fcmFail={}",
                event.notificationId(),
                event.userId(),
                aggregate,
                ok,
                fail);
        safeSendResult(
                new PushResultEvent(
                        UUID.randomUUID(),
                        event.notificationId(),
                        aggregate,
                        Instant.now(),
                        fail > 0 ? "PARTIAL_OR_FULL_FAILURE" : null));
    }

    private void safeSendResult(PushResultEvent result) {
        try {
            pushKafkaProducer.sendResult(result);
        } catch (Exception e) {
            log.warn("push.result Kafka publish skipped/failed notificationId={}: {}", result.notificationId(), e.getMessage());
        }
    }

    private static String prefix(String token) {
        if (token == null || token.length() <= 8) {
            return "***";
        }
        return token.substring(0, 8);
    }
}
