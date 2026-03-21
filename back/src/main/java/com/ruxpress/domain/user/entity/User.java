package com.ruxpress.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 회원 (users 테이블).
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = true;

    @Column(name = "phone_verified", nullable = false)
    @Builder.Default
    private Boolean phoneVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "signup_type", nullable = false, length = 20)
    @Builder.Default
    private SignupType signupType = SignupType.EMAIL;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String timezone = "Asia/Seoul";


    @Column(name = "notification_settings", columnDefinition = "JSON")
    private String notificationSettings;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateLastLoginAt() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public enum UserStatus {
        ACTIVE, SUSPENDED, WITHDRAWN
    }

    public enum SignupType {
        EMAIL, PHONE, GOOGLE

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
