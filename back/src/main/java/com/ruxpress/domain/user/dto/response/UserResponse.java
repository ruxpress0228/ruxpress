package com.ruxpress.domain.user.dto.response;

import com.ruxpress.domain.user.entity.SignupType;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class UserResponse {

    private final Long id;
    private final String email;
    private final String phone;
    private final String nickname;
    private final String profileImageUrl;
    private final UserStatus status;
    private final boolean emailVerified;
    private final boolean phoneVerified;
    private final SignupType signupType;
    private final String timezone;
    private final LocalDateTime lastLoginAt;
    private final LocalDateTime withdrawnAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.getNickname(),
                user.getProfileImageUrl(),
                user.getStatus(),
                user.isEmailVerified(),
                user.isPhoneVerified(),
                user.getSignupType(),
                user.getTimezone(),
                user.getLastLoginAt(),
                user.getWithdrawnAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
