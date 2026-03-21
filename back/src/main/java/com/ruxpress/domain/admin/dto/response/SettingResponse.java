package com.ruxpress.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SettingResponse {

    private final String key;
    private final String value;
    private final Long updatedBy;
    private final LocalDateTime updatedAt;
}
