package com.ruxpress.domain.user.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.user.dto.ChangePasswordRequest;
import com.ruxpress.domain.user.dto.EmailSignupRequest;
import com.ruxpress.domain.user.dto.EmailVerificationRequest;
import com.ruxpress.domain.user.dto.EmailVerifyRequest;
import com.ruxpress.domain.user.dto.ForgotPasswordRequest;
import com.ruxpress.domain.user.dto.LoginRequest;
import com.ruxpress.domain.user.dto.LoginResponse;
import com.ruxpress.domain.user.dto.ResetPasswordRequest;
import com.ruxpress.domain.user.dto.response.UserResponse;
import com.ruxpress.domain.user.service.EmailVerificationService;
import com.ruxpress.domain.user.service.PasswordResetService;
import com.ruxpress.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final EmailVerificationService emailVerificationService;
    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final JwtUtil jwtUtil;

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
     * 현재 로그인한 회원 정보 (Bearer: 일반 회원 JWT)
     */
    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Long userId = jwtUtil.resolveUserIdFromAuthorizationHeader(authorization);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        UserResponse profile = userService.getProfileForCurrentUser(userId);
        return ApiResponse.success(profile);
    }

    /**
     * 비밀번호 변경 (로그인 상태, 현재 비밀번호 확인)
     */
    @PostMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = jwtUtil.resolveUserIdFromAuthorizationHeader(authorization);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        userService.changePassword(userId, request);
        return ApiResponse.success("비밀번호가 변경되었습니다.", null);
    }

    /**
     * 이메일/비밀번호 로그인. 성공 시 JWT 및 사용자 정보 반환.
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ApiResponse.success("로그인되었습니다.", response);
    }

    /**
     * 비밀번호 찾기: 등록된 이메일이면 재설정 링크 발송(항상 동일 메시지).
     */
    @PostMapping("/password/forgot")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        return ApiResponse.success("입력하신 이메일로 재설정 안내가 발송되었습니다. (메일이 없으면 스팸함을 확인해 주세요)", null);
    }

    /**
     * 토큰으로 비밀번호 재설정
     */
    @PostMapping("/password/reset")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success("비밀번호가 변경되었습니다. 로그인해 주세요.", null);
    }
}
