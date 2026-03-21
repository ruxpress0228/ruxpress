package com.ruxpress.domain.admin.dto.response;

import com.ruxpress.domain.admin.entity.SystemSetting;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SettingResponse {

    private final Long id;
    private final String category;
    private final String key;
    private final String value;
    private final String description;
    private final Long updatedBy;
    private final LocalDateTime updatedAt;

    public static SettingResponse from(SystemSetting s) {
        return new SettingResponse(
                s.getId(), s.getCategory(), s.getSettingKey(), s.getSettingValue(),
                s.getDescription(), s.getUpdatedBy(), s.getUpdatedAt());
    }
}
