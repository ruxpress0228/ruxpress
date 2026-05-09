package com.ruxpress.domain.user.service;

// Spring & Lombok
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Common (Utility, Exception, DTO)
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;

// Domain - User (DTO)
import com.ruxpress.domain.user.dto.ChangePasswordRequest;
import com.ruxpress.domain.user.dto.EmailSignupRequest;
import com.ruxpress.domain.user.dto.LoginRequest;
import com.ruxpress.domain.user.dto.LoginResponse;
import com.ruxpress.domain.user.dto.UpdateProfileRequest;
import com.ruxpress.domain.user.dto.response.UserResponse;
import com.ruxpress.domain.user.dto.response.UserStatsResponse;

// Domain - User (Entity & Repository)
import com.ruxpress.domain.user.entity.SignupType;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.entity.UserStatus;
import com.ruxpress.domain.user.entity.Verification;
import com.ruxpress.domain.user.repository.UserRepository;
import com.ruxpress.domain.user.repository.VerificationRepository;

// Java Standard Library
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class UserService {

    private static final int SIGNUP_VERIFICATION_VALID_MINUTES = 30;

    private final UserRepository userRepository;
    private final VerificationRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(String keyword, UserStatus status, Pageable pageable) {
        Page<User> page;

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasStatus = status != null;

        if (hasKeyword && hasStatus) {
            page = userRepository.searchByKeywordAndStatus(keyword.trim(), status, pageable);
        } else if (hasKeyword) {
            page = userRepository.searchByKeyword(keyword.trim(), pageable);
        } else if (hasStatus) {
            page = userRepository.findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(status, pageable);
        } else {
            page = userRepository.findByDeletedAtIsNullOrderByCreatedAtDesc(pageable);
        }

        List<UserResponse> content = page.getContent().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());

        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return UserResponse.from(user);
    }

    /**
     * 로그인한 회원 본인 프로필 (삭제·비활성 계정 제외).
     */
    @Transactional(readOnly = true)
    public UserResponse getProfileForCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "이용할 수 없는 계정입니다.");
        }
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse changeUserStatus(Long id, UserStatus newStatus) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        user.changeStatus(newStatus);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats() {
        long total = userRepository.countByDeletedAtIsNull();
        long active = userRepository.countByStatusAndDeletedAtIsNull(UserStatus.ACTIVE);
        long suspended = userRepository.countByStatusAndDeletedAtIsNull(UserStatus.SUSPENDED);
        long withdrawn = userRepository.countByStatusAndDeletedAtIsNull(UserStatus.WITHDRAWN);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long newToday = userRepository.countByCreatedAtAfterAndDeletedAtIsNull(todayStart);

        return new UserStatsResponse(total, active, suspended, withdrawn, newToday);
    }

    /**
     * 이메일 인증 완료 후 회원가입. 인증된 이메일이 최근 30분 이내여야 함.
     */
    @Transactional
    public void signupWithEmail(EmailSignupRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        if (email == null || email.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "이메일을 입력하세요.");
        }

        // 이메일 인증 완료 여부 및 유효 시간 확인
        Verification verified = verificationRepository
                .findTopByTypeAndTargetAndIsVerifiedOrderByCreatedAtDesc(
                        Verification.VerificationType.EMAIL, email, true)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_VERIFICATION_REQUIRED, "이메일 인증을 먼저 완료해 주세요."));

        LocalDateTime validUntil = verified.getCreatedAt().plusMinutes(SIGNUP_VERIFICATION_VALID_MINUTES);
        if (LocalDateTime.now().isAfter(validUntil)) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_REQUIRED, "이메일 인증이 만료되었습니다. 인증을 다시 진행해 주세요.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL, "이미 사용 중인 이메일입니다.");
        }

        String nickname = request.getNickname() == null ? null : request.getNickname().trim();
        if (nickname == null || nickname.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "닉네임을 입력하세요.");
        }

        String line1 = request.getAddressLine1() == null ? null : request.getAddressLine1().trim();
        if (line1 == null || line1.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "주소를 입력하세요.");
        }
        String postal = request.getAddressPostalCode() == null ? null : request.getAddressPostalCode().trim();
        String line2 = request.getAddressLine2() == null ? null : request.getAddressLine2().trim();

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        LocalDateTime now = LocalDateTime.now();

        User user = User.builder()
                .email(email)
                .passwordHash(encodedPassword)
                .nickname(nickname)
                .addressPostalCode(postal == null || postal.isEmpty() ? null : postal)
                .addressLine1(line1)
                .addressLine2(line2 == null || line2.isEmpty() ? null : line2)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .phoneVerified(false)
                .signupType(SignupType.EMAIL)
                .timezone("Asia/Seoul")
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(user);
    }

    /**
     * 이메일/비밀번호 로그인. 성공 시 JWT 및 사용자 정보 반환.
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().trim().toLowerCase();
        if (email == null || email.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "이메일을 입력하세요.");
        }
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "비밀번호를 입력하세요.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "계정이 비활성화되었습니다.");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        user.updateLastLoginAt();
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new LoginResponse(token, user.getId(), user.getEmail(), user.getNickname());
    }

    /**
     * 로그인한 회원의 비밀번호 변경 (현재 비밀번호 확인).
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "이용할 수 없는 계정입니다.");
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "비밀번호로 가입한 계정만 변경할 수 있습니다.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "현재 비밀번호가 일치하지 않습니다.");
        }
        user.changePasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * 로그인한 회원의 프로필(닉네임/주소) 수정.
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "이용할 수 없는 계정입니다.");
        }

        String nickname = request.getNickname() == null ? null : request.getNickname().trim();
        if (nickname == null || nickname.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "닉네임을 입력하세요.");
        }
        String line1 = request.getAddressLine1() == null ? null : request.getAddressLine1().trim();
        if (line1 == null || line1.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "주소를 입력하세요.");
        }
        String postal = request.getAddressPostalCode() == null ? null : request.getAddressPostalCode().trim();
        String line2 = request.getAddressLine2() == null ? null : request.getAddressLine2().trim();

        user.updateProfile(
                nickname,
                postal == null || postal.isEmpty() ? null : postal,
                line1,
                line2 == null || line2.isEmpty() ? null : line2);
        return UserResponse.from(userRepository.save(user));
    }
}
