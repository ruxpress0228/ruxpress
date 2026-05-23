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
import com.ruxpress.domain.user.dto.PushContextRequest;
import com.ruxpress.domain.user.dto.ResetPasswordRequest;
import com.ruxpress.domain.user.dto.UpdateProfileRequest;
import com.ruxpress.domain.user.dto.request.UserAddressCreateRequest;
import com.ruxpress.domain.user.dto.request.UserAddressUpdateRequest;
import com.ruxpress.domain.user.dto.response.UserAddressResponse;
import com.ruxpress.domain.user.dto.response.UserResponse;
import com.ruxpress.domain.user.entity.DeviceType;
import com.ruxpress.domain.user.service.EmailVerificationService;
import com.ruxpress.domain.user.service.PasswordResetService;
import com.ruxpress.domain.user.service.UserAddressService;
import com.ruxpress.domain.user.service.UserDeviceService;
import com.ruxpress.domain.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final EmailVerificationService emailVerificationService;
    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final UserDeviceService userDeviceService;
    private final UserAddressService userAddressService;

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
    public ApiResponse<UserResponse> me(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return ApiResponse.success(userService.getProfileForCurrentUser(userId));
    }

    /**
     * 앱 FCM 토큰 수신 end-point
     */
    @PostMapping("/me/push-context")
    public ApiResponse<Void> pushContext(
            @RequestBody(required = false) PushContextRequest body,
            HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (body == null) {
            body = new PushContextRequest();
        }
        log.info(
                "[push-context] userId={} fcmToken={} notificationsEnabled={} manufacturer={} model={} brand={} device={} sdkInt={} versionRelease={}",
                userId,
                body.getFcmToken(),
                body.getNotificationsEnabled(),
                body.getManufacturer(),
                body.getModel(),
                body.getBrand(),
                body.getDevice(),
                body.getSdkInt(),
                body.getVersionRelease());

        String token = body.getFcmToken() == null ? "" : body.getFcmToken().trim();
        if (!StringUtils.hasText(token)) {
            return ApiResponse.success("수신되었습니다.", null);
        }

        String ip = resolveClientIp(request);
        if (Boolean.FALSE.equals(body.getNotificationsEnabled())) {
            userDeviceService.deactivateAndEnqueueSync(userId, token);
        } else {
            String deviceName = buildDeviceDisplayName(body);
            userDeviceService.upsertAndEnqueueSync(
                    userId, token, DeviceType.ANDROID, deviceName, ip);
        }
        return ApiResponse.success("수신되었습니다.", null);
    }

    /**
     * 로그인한 회원의 프로필(닉네임/주소) 수정.
     */
    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateProfile(
            HttpServletRequest request,
            @Valid @RequestBody UpdateProfileRequest body) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return ApiResponse.success("프로필이 수정되었습니다.", userService.updateProfile(userId, body));
    }

    @GetMapping("/me/addresses")
    public ApiResponse<List<UserAddressResponse>> listMyAddresses(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return ApiResponse.success(userAddressService.listMyAddresses(userId));
    }

    @PostMapping("/me/addresses")
    public ApiResponse<UserAddressResponse> createMyAddress(
            HttpServletRequest request,
            @Valid @RequestBody UserAddressCreateRequest body) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return ApiResponse.success("배송지가 추가되었습니다.", userAddressService.create(userId, body));
    }

    @PatchMapping("/me/addresses/{addressId}")
    public ApiResponse<UserAddressResponse> updateMyAddress(
            HttpServletRequest request,
            @PathVariable Long addressId,
            @Valid @RequestBody UserAddressUpdateRequest body) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return ApiResponse.success("배송지가 수정되었습니다.", userAddressService.update(userId, addressId, body));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    public ApiResponse<Void> deleteMyAddress(HttpServletRequest request, @PathVariable Long addressId) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        userAddressService.delete(userId, addressId);
        return ApiResponse.success("배송지가 삭제되었습니다.", null);
    }

    @PostMapping("/me/addresses/{addressId}/default")
    public ApiResponse<UserAddressResponse> setDefaultMyAddress(HttpServletRequest request, @PathVariable Long addressId) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return ApiResponse.success("기본 배송지로 설정되었습니다.", userAddressService.setDefault(userId, addressId));
    }

    @PostMapping("/me/password")
    public ApiResponse<Void> changePassword(
            HttpServletRequest request,
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        userService.changePassword(userId, changePasswordRequest);
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

    private static String buildDeviceDisplayName(PushContextRequest body) {
        String m = body.getManufacturer() == null ? "" : body.getManufacturer().trim();
        String model = body.getModel() == null ? "" : body.getModel().trim();
        String name = (m + " " + model).trim();
        return StringUtils.hasText(name) ? name : "Android";
    }

    private static String resolveClientIp(HttpServletRequest request) {
        if (request == null)
            return null;
        String xff = request.getHeader("X-Forwarded-For");
        return StringUtils.hasText(xff) ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
