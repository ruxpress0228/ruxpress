package com.ruxpress.domain.admin.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "admins")
public class Admin extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdminRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdminStatus status = AdminStatus.ACTIVE;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public static Admin create(String email, String encodedPassword, String name, String phone, AdminRole role) {
        Admin admin = new Admin();
        admin.email = email;
        admin.passwordHash = encodedPassword;
        admin.name = name;
        admin.phone = phone;
        admin.role = role;
        admin.status = AdminStatus.ACTIVE;
        return admin;
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateInfo(String name, String phone) {
        this.name = name;
        if (phone != null) this.phone = phone;
    }

    public void changeStatus(AdminStatus status) {
        this.status = status;
    }

    public void changeRole(AdminRole role) {
        this.role = role;
    }

    public void changePassword(String encodedPassword) {
        this.passwordHash = encodedPassword;
    }
}
