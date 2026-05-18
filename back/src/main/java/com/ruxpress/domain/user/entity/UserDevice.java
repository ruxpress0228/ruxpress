package com.ruxpress.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "user_devices")
@EntityListeners(AuditingEntityListener.class)
public class UserDevice {

    public static UserDevice create(
            Long userId,
            String deviceToken,
            DeviceType deviceType,
            String deviceName,
            String ipAddress) {
        UserDevice d = new UserDevice();
        d.userId = userId;
        d.deviceToken = deviceToken;
        d.deviceType = deviceType;
        d.deviceName = deviceName;
        d.ipAddress = ipAddress;
        d.isActive = true;
        d.lastUsedAt = LocalDateTime.now(ZoneOffset.UTC);
        return d;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "device_token", nullable = false, length = 500)
    private String deviceToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    private DeviceType deviceType = DeviceType.WEB;

    @Column(name = "device_name", length = 200)
    private String deviceName;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void applyRegistrationUpdate(String deviceName, String ipAddress, boolean active) {
        this.deviceName = deviceName;
        this.ipAddress = ipAddress;
        this.isActive = active;
        this.lastUsedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }
}
