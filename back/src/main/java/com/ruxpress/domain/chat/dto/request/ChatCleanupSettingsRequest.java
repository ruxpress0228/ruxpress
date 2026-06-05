package com.ruxpress.domain.chat.dto.request;

import com.ruxpress.domain.chat.entity.ChatRetentionPeriod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatCleanupSettingsRequest {

    @NotNull
    private ChatRetentionPeriod retentionPeriod;
}
