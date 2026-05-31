package com.ruxpress.domain.chat.dto.response;

import com.ruxpress.domain.chat.entity.ChatRetentionPeriod;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ChatCleanupSettingsResponse {

    private final ChatRetentionPeriod retentionPeriod;
    private final List<RetentionOption> options;

    @Getter
    @AllArgsConstructor
    public static class RetentionOption {
        private final ChatRetentionPeriod value;
        private final int months;
    }
}
