package com.ruxpress.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 회원 배송지 (user_addresses).
 */
@Entity
@Table(name = "user_addresses")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 50)
    private String label;

    @Column(name = "recipient_name", length = 50)
    private String recipientName;

    @Column(name = "recipient_phone", length = 20)
    private String recipientPhone;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "address_line1", nullable = false, length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public static UserAddress create(
            Long userId,
            String label,
            String recipientName,
            String recipientPhone,
            String postalCode,
            String addressLine1,
            String addressLine2,
            boolean isDefault) {
        UserAddress a = new UserAddress();
        a.userId = userId;
        a.label = label;
        a.recipientName = recipientName;
        a.recipientPhone = recipientPhone;
        a.postalCode = postalCode;
        a.addressLine1 = addressLine1;
        a.addressLine2 = addressLine2;
        a.isDefault = isDefault;
        return a;
    }
}
