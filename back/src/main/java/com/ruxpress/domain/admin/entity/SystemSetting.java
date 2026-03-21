package com.ruxpress.domain.admin.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "system_settings")
@EntityListeners(AuditingEntityListener.class)
public class SystemSetting {

    @Id
    @Column(name = "setting_key", length = 100)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, length = 500)
    private String settingValue;

    @Column(name = "updated_by")
    private Long updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static SystemSetting create(String key, String value, Long updatedBy) {
        SystemSetting s = new SystemSetting();
        s.settingKey = key;
        s.settingValue = value;
        s.updatedBy = updatedBy;
        return s;
    }

    public void updateValue(String value, Long updatedBy) {
        this.settingValue = value;
        this.updatedBy = updatedBy;
    }
}
