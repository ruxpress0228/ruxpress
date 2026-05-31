package com.ruxpress.domain.chat.service;

import com.ruxpress.domain.admin.entity.SystemSetting;
import com.ruxpress.domain.admin.repository.SystemSettingRepository;
import com.ruxpress.domain.chat.dto.response.ChatCleanupSettingsResponse;
import com.ruxpress.domain.chat.entity.ChatRetentionPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatCleanupSettingsService {

    static final String CATEGORY = "CHAT";
    static final String RETENTION_KEY = "chat_message_retention";

    private final SystemSettingRepository systemSettingRepository;

    public ChatCleanupSettingsResponse getSettings() {
        return new ChatCleanupSettingsResponse(getRetentionPeriod(), listOptions());
    }

    public ChatRetentionPeriod getRetentionPeriod() {
        return systemSettingRepository.findBySettingKey(RETENTION_KEY)
                .map(s -> ChatRetentionPeriod.fromValue(s.getSettingValue()))
                .orElse(ChatRetentionPeriod.PERMANENT);
    }

    @Transactional
    public ChatCleanupSettingsResponse updateRetentionPeriod(ChatRetentionPeriod period, Long adminId) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(RETENTION_KEY)
                .orElseGet(() -> SystemSetting.create(
                        CATEGORY,
                        RETENTION_KEY,
                        period.name(),
                        "채팅 메시지 보존 기간",
                        adminId));
        setting.updateValue(period.name(), adminId);
        systemSettingRepository.save(setting);
        return new ChatCleanupSettingsResponse(period, listOptions());
    }

    private static List<ChatCleanupSettingsResponse.RetentionOption> listOptions() {
        return Arrays.stream(ChatRetentionPeriod.values())
                .map(p -> new ChatCleanupSettingsResponse.RetentionOption(p, p.getMonths()))
                .toList();
    }
}
