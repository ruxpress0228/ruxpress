package com.ruxpress.domain.user.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@ruxpress.com}")
    private String fromAddress;

    @Value("${app.mail.verification.subject:Main-Proxy 이메일 인증}")
    private String subject;

    @Value("${app.mail.password-reset.subject:Main-Proxy 비밀번호 재설정}")
    private String passwordResetSubject;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * 이메일 인증 코드를 발송합니다.
     * SMTP 비밀번호가 설정되지 않은 경우(로컬/개발)에는 실제 발송 없이 코드를 서버 로그에만 출력합니다.
     */
    public void sendVerificationCode(String toEmail, String code) {
        if (mailPassword == null || mailPassword.trim().isBlank()) {
            log.info("[메일 미설정] 인증 코드만 로그 출력 (실제 메일 미발송). toEmail={}, code={}", toEmail, code);
            return;
        }
        String body = String.format(
                "Main-Proxy 이메일 인증 코드입니다.\n\n인증번호: %s\n\n유효시간: 10분\n\n본인이 요청한 것이 아니라면 무시하세요.",
                code);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", toEmail, e);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED, "이메일 발송에 실패했습니다.");
        }
    }

    /**
     * 비밀번호 재설정 링크 메일. SMTP 미설정 시 링크만 로그 출력.
     */
    public void sendPasswordResetLink(String toEmail, String resetUrl) {
        if (mailPassword == null || mailPassword.trim().isBlank()) {
            log.info("[메일 미설정] 비밀번호 재설정 링크 (실제 메일 미발송). toEmail={}, url={}", toEmail, resetUrl);
            return;
        }
        String body = String.format(
                "비밀번호를 재설정하려면 아래 링크를 클릭하세요.\n\n%s\n\n유효시간: 1시간\n\n본인이 요청한 것이 아니라면 무시하세요.",
                resetUrl);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(passwordResetSubject);
        message.setText(body);
        try {
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED, "이메일 발송에 실패했습니다.");
        }
    }
}
