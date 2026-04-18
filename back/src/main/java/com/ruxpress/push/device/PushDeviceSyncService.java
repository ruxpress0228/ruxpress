package com.ruxpress.push.device;

import com.ruxpress.push.domain.PushDevice;
import com.ruxpress.push.domain.PushDeviceRepository;
import com.ruxpress.push.kafka.dto.UserDeviceSyncEvent;
import com.ruxpress.push.util.LogTokens;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushDeviceSyncService {

    private final PushDeviceRepository pushDeviceRepository;

    @Transactional
    public void apply(UserDeviceSyncEvent event) {
        if (event.deviceType() == null) {
            log.warn(
                    "device-sync skip: deviceType null userId={} token={}",
                    event.userId(),
                    LogTokens.maskDeviceToken(event.deviceToken()));
            return;
        }
        String dt = event.deviceType().toUpperCase(Locale.ROOT);
        if ("WEB".equals(dt)) {
            log.info("device-sync skip WEB userId={} eventId={}", event.userId(), event.eventId());
            return;
        }
        if (!"ANDROID".equals(dt) && !"IOS".equals(dt)) {
            log.warn("Unknown deviceType={}, skip", event.deviceType());
            return;
        }

        boolean deactivate = event.operation() != null && "DEACTIVATE".equalsIgnoreCase(event.operation());
        boolean active = !deactivate && (event.isActive() == null || event.isActive());

        if (!active) {
            pushDeviceRepository
                    .findByDeviceToken(event.deviceToken())
                    .ifPresentOrElse(
                            d -> {
                                d.setActive(false);
                                d.setUpdatedAt(LocalDateTime.now());
                                pushDeviceRepository.save(d);
                                log.info(
                                        "device-sync push_devices deactivated id={} userId={} token={}",
                                        d.getId(),
                                        d.getUserId(),
                                        LogTokens.maskDeviceToken(event.deviceToken()));
                            },
                            () -> log.info(
                                    "device-sync deactivate: no push_devices row userId={} token={}",
                                    event.userId(),
                                    LogTokens.maskDeviceToken(event.deviceToken())));
            return;
        }

        LocalDateTime lastUsed = parseLastUsed(event.lastUsedAt());

        PushDevice device = pushDeviceRepository.findByDeviceToken(event.deviceToken())
                .orElseGet(() -> PushDevice.builder()
                        .userId(event.userId())
                        .deviceToken(event.deviceToken())
                        .deviceType(dt)
                        .active(true)
                        .build());

        device.setUserId(event.userId());
        device.setDeviceType(dt);
        device.setActive(true);
        device.setLastUsedAt(lastUsed);
        device.setUpdatedAt(LocalDateTime.now());
        pushDeviceRepository.save(device);
        log.info(
                "device-sync push_devices upserted id={} userId={} deviceType={} active=true token={}",
                device.getId(),
                device.getUserId(),
                device.getDeviceType(),
                LogTokens.maskDeviceToken(event.deviceToken()));
    }

    private static LocalDateTime parseLastUsed(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw);
        } catch (DateTimeParseException e) {
            try {
                return Instant.parse(raw).atZone(ZoneOffset.UTC).toLocalDateTime();
            } catch (Exception ignored) {
                return null;
            }
        }
    }
}
