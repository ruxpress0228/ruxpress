package com.ruxpress.domain.user.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.user.dto.EmailSignupRequest;
import com.ruxpress.domain.user.dto.EmailVerificationRequest;
import com.ruxpress.domain.user.dto.EmailVerifyRequest;
import com.ruxpress.domain.user.dto.LoginRequest;
import com.ruxpress.domain.user.dto.LoginResponse;
import com.ruxpress.domain.user.service.EmailVerificationService;
import com.ruxpress.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final EmailVerificationService emailVerificationService;
    private final UserService userService;

    /**
     * 이메일 인증 코드 발송 (실제 메일 발송)
     */
    @PostMapping("/email/send-verification")
    public ApiResponse<Void> sendEmailVerification(@Valid @RequestBody EmailVerificationRequest request) {
        emailVerificationService.sendVerificationCode(request.getEmail());
        return ApiResponse.success("인증 메일이 발송되었습니다.", null);
    }

    /**
     * 이메일 인증 코드 검증
     */
    @PostMapping("/email/verify")
    public ApiResponse<Void> verifyEmail(@Valid @RequestBody EmailVerifyRequest request) {
        emailVerificationService.verifyCode(request.getEmail(), request.getCode());
        return ApiResponse.success("이메일이 인증되었습니다.", null);
    }

    /**
     * 이메일 인증 후 회원가입
     */
    @PostMapping("/signup")
    public ApiResponse<Void> signup(@Valid @RequestBody EmailSignupRequest request) {
        userService.signupWithEmail(request);
        return ApiResponse.success("회원가입이 완료되었습니다.", null);
    }

    /**
     * 이메일/비밀번호 로그인. 성공 시 JWT 및 사용자 정보 반환.
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ApiResponse.success("로그인되었습니다.", response);
    }
}
