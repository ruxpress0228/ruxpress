package com.ruxpress.domain.user.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "signup_type", nullable = false)
    private SignupType signupType;

    @Column(length = 50)
    private String timezone;

    @Column(name = "notification_settings", columnDefinition = "JSON")
    private String notificationSettings;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    public static User create(String email, String nickname, SignupType signupType) {
        User user = new User();
        user.email = email;
        user.nickname = nickname;
        user.signupType = signupType;
        user.status = UserStatus.ACTIVE;
        return user;
    }

    public static User createWithPassword(String email, String passwordHash, String nickname, SignupType signupType) {
        User user = new User();
        user.email = email;
        user.passwordHash = passwordHash;
        user.nickname = nickname;
        user.signupType = signupType;
        user.status = UserStatus.ACTIVE;
        return user;
    }

    public void changeStatus(UserStatus newStatus) {
        this.status = newStatus;
        if (newStatus == UserStatus.WITHDRAWN) {
            this.withdrawnAt = LocalDateTime.now();
        }
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
}
