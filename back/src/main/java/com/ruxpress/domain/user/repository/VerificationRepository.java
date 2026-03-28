package com.ruxpress.domain.user.repository;

import com.ruxpress.domain.user.entity.Verification;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationRepository extends JpaRepository<Verification, Long> {

    Optional<Verification> findTopByTypeAndTargetAndIsVerifiedOrderByCreatedAtDesc(
            Verification.VerificationType type, String target, Boolean isVerified);

    Optional<Verification> findTopByTypeAndCodeAndIsVerifiedOrderByCreatedAtDesc(
            Verification.VerificationType type, String code, Boolean isVerified);

    void deleteByTypeAndTarget(Verification.VerificationType type, String target);
}
