package com.ruxpress.domain.user.service;

import com.ruxpress.domain.user.entity.DeviceType;
import com.ruxpress.domain.user.entity.UserDevice;
import com.ruxpress.domain.user.repository.UserDeviceRepository;
import com.ruxpress.integration.kafka.PushKafkaOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserDeviceService {

    private final UserDeviceRepository userDeviceRepository;
    private final PushKafkaOutboxService pushKafkaOutboxService;

    @Transactional
    public UserDevice upsertAndEnqueueSync(
            Long userId,
            String deviceToken,
            DeviceType deviceType,
            String deviceName,
            String ipAddress) {
        Optional<UserDevice> existing = userDeviceRepository.findByUserIdAndDeviceToken(userId, deviceToken);
        UserDevice device;
        if (existing.isPresent()) {
            device = existing.get();
            device.applyRegistrationUpdate(deviceName, ipAddress, true);
        } else {
            device = UserDevice.create(userId, deviceToken, deviceType, deviceName, ipAddress);
        }
        UserDevice saved = userDeviceRepository.saveAndFlush(device);
        pushKafkaOutboxService.scheduleDeviceSyncAfterCommit(saved);
        return saved;
    }

    @Transactional
    public void deactivateAndEnqueueSync(Long userId, String deviceToken) {
        userDeviceRepository
                .findByUserIdAndDeviceToken(userId, deviceToken)
                .ifPresent(
                        device -> {
                            device.setActive(false);
                            UserDevice saved = userDeviceRepository.saveAndFlush(device);
                            pushKafkaOutboxService.scheduleDeviceSyncAfterCommit(saved);
                        });
    }
}
