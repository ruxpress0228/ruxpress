package com.ruxpress.push.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PushDeliveryAttemptRepository extends JpaRepository<PushDeliveryAttempt, Long> {
}
