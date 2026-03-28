package com.ruxpress.domain.user.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.entity.UserStatus;
import com.ruxpress.domain.user.entity.Verification;
import com.ruxpress.domain.user.repository.UserRepository;
import com.ruxpress.domain.user.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int RESET_LINK_VALID_HOURS = 1;

    private final UserRepository userRepository;
    private final VerificationRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost}")
    private String frontendBaseUrl;

    /**
     * 가입된 이메일이면 재설정 토큰 메일 발송. 없어도 동일한 성공 응답(이메일 노출 방지).
     */
    @Transactional
    public void requestPasswordReset(String email) {
        String normalized = email == null ? null : email.trim().toLowerCase();
        if (normalized == null || normalized.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "이메일을 입력하세요.");
        }
        if (!normalized.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바른 이메일 형식이 아닙니다.");
        }

        userRepository.findByEmail(normalized).ifPresent(user -> {
            if (user.getStatus() != UserStatus.ACTIVE) {
                return;
            }
            if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                return;
            }
            verificationRepository.deleteByTypeAndTarget(Verification.VerificationType.PASSWORD_RESET, normalized);

            String token = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(RESET_LINK_VALID_HOURS);
            Verification row = Verification.builder()
                    .type(Verification.VerificationType.PASSWORD_RESET)
                    .target(normalized)
                    .code(token)
                    .isVerified(false)
                    .attemptCount(0)
                    .expiresAt(expiresAt)
                    .createdAt(LocalDateTime.now())
                    .build();
            verificationRepository.save(row);

            String base = frontendBaseUrl.endsWith("/")
                    ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                    : frontendBaseUrl;
            String resetUrl = base + "/reset-password?token=" + token;
            emailService.sendPasswordResetLink(normalized, resetUrl);
        });
    }

    /**
     * 토큰으로 비밀번호 변경. 성공 시 토큰은 사용 완료 처리.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        String trimmedToken = token == null ? null : token.trim();
        if (trimmedToken == null || trimmedToken.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "재설정 링크가 올바르지 않습니다.");
        }

        Verification verification = verificationRepository
                .findTopByTypeAndCodeAndIsVerifiedOrderByCreatedAtDesc(
                        Verification.VerificationType.PASSWORD_RESET, trimmedToken, false)
                .orElseThrow(() -> new BusinessException(ErrorCode.VERIFICATION_NOT_FOUND,
                        "유효하지 않거나 이미 사용된 재설정 링크입니다."));

        if (verification.isExpired()) {
            throw new BusinessException(ErrorCode.VERIFICATION_EXPIRED, "재설정 링크가 만료되었습니다. 다시 요청해 주세요.");
        }

        User user = userRepository.findByEmail(verification.getTarget())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "계정이 비활성화되었습니다.");
        }

        user.changePasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        verification.markVerified();
        verificationRepository.save(verification);
    }
}
