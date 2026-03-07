package com.ruxpress.domain.user.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.user.entity.Verification;
import com.ruxpress.domain.user.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final int CODE_LENGTH = 6;
    private static final int VALID_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;

    private final VerificationRepository verificationRepository;
    private final EmailService emailService;

    /**
     * 이메일로 6자리 인증 코드를 발송하고 verifications 테이블에 저장합니다.
     */
    @Transactional
    public void sendVerificationCode(String email) {
        String normalizedEmail = email == null ? null : email.trim().toLowerCase();
        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "이메일을 입력하세요.");
        }
        if (!normalizedEmail.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바른 이메일 형식이 아닙니다.");
        }

        String code = generateNumericCode(CODE_LENGTH);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(VALID_MINUTES);

        Verification verification = Verification.builder()
                .type(Verification.VerificationType.EMAIL)
                .target(normalizedEmail)
                .code(code)
                .isVerified(false)
                .attemptCount(0)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now())
                .build();
        verificationRepository.save(verification);
        emailService.sendVerificationCode(normalizedEmail, code);
    }

    /**
     * 인증 코드를 검증합니다. 성공 시 해당 레코드를 인증 완료 처리합니다.
     */
    @Transactional
    public void verifyCode(String email, String code) {
        String normalizedEmail = email == null ? null : email.trim().toLowerCase();
        String trimmedCode = code == null ? null : code.trim();
        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "이메일을 입력하세요.");
        }
        if (trimmedCode == null || trimmedCode.length() != CODE_LENGTH) {
            throw new BusinessException(ErrorCode.INVALID_VERIFICATION_CODE, "인증번호는 6자리 숫자여야 합니다.");
        }

        Optional<Verification> opt = verificationRepository.findTopByTypeAndTargetAndIsVerifiedOrderByCreatedAtDesc(
                Verification.VerificationType.EMAIL, normalizedEmail, false);

        if (opt.isEmpty()) {
            throw new BusinessException(ErrorCode.VERIFICATION_NOT_FOUND, "인증 요청을 먼저 진행해 주세요.");
        }
        Verification verification = opt.get();
        if (verification.isExpired()) {
            throw new BusinessException(ErrorCode.VERIFICATION_EXPIRED, "인증번호가 만료되었습니다. 다시 발송해 주세요.");
        }
        if (verification.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new BusinessException(ErrorCode.TOO_MANY_VERIFICATION_ATTEMPTS, "시도 횟수를 초과했습니다. 인증번호를 다시 발송해 주세요.");
        }
        if (!verification.getCode().equals(trimmedCode)) {
            verification.incrementAttemptCount();
            verificationRepository.save(verification);
            throw new BusinessException(ErrorCode.INVALID_VERIFICATION_CODE, "인증번호가 올바르지 않습니다.");
        }
        verification.markVerified();
        verificationRepository.save(verification);
    }

    private static String generateNumericCode(int length) {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(r.nextInt(0, 10));
        }
        return sb.toString();
    }
}
