package com.ruxpress.domain.chat.service;

import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.domain.chat.entity.ChatMessage;
import com.ruxpress.domain.chat.entity.ChatRetentionPeriod;
import com.ruxpress.domain.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageCleanupService {

    private static final int BATCH_SIZE = 500;

    private final ChatCleanupSettingsService cleanupSettingsService;
    private final ChatMessageRepository chatMessageRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;

    @Scheduled(cron = "${ruxpress.chat.cleanup.cron:0 0 3 * * *}")
    @Transactional
    public void cleanupExpiredMessages() {
        ChatRetentionPeriod period = cleanupSettingsService.getRetentionPeriod();
        if (period.isPermanent()) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusMonths(period.getMonths());
        int totalDeleted = 0;

        while (true) {
            List<ChatMessage> batch = chatMessageRepository
                    .findTop500ByCreatedAtBeforeOrderByCreatedAtAsc(cutoff);
            if (batch.isEmpty()) {
                break;
            }

            Set<Long> attachmentIds = new HashSet<>();
            for (ChatMessage message : batch) {
                if (message.getAttachmentId() != null) {
                    attachmentIds.add(message.getAttachmentId());
                }
            }
            for (Long attachmentId : attachmentIds) {
                attachmentRepository.findById(attachmentId).ifPresent(this::deleteAttachmentFile);
            }

            chatMessageRepository.deleteAll(batch);
            totalDeleted += batch.size();

            if (batch.size() < BATCH_SIZE) {
                break;
            }
        }

        if (totalDeleted > 0) {
            log.info("Chat message cleanup completed: deleted {} messages older than {} months",
                    totalDeleted, period.getMonths());
        }
    }

    private void deleteAttachmentFile(Attachment attachment) {
        try {
            fileStoragePort.delete(attachment.getStoredUrl());
        } catch (Exception e) {
            log.warn("Failed to delete chat attachment file: {}", attachment.getStoredUrl(), e);
        }
        attachmentRepository.delete(attachment);
    }
}
