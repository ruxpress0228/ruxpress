package com.ruxpress.push.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushDeviceRepository extends JpaRepository<PushDevice, Long> {

    List<PushDevice> findByUserIdAndActiveTrueAndDeviceTypeIn(Long userId, List<String> deviceTypes);

    Optional<PushDevice> findByDeviceToken(String deviceToken);
}
