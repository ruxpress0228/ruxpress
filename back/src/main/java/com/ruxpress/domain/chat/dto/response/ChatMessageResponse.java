package com.ruxpress.domain.chat.dto.response;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.domain.chat.entity.ChatMessage;
import com.ruxpress.domain.chat.entity.ChatMessageType;
import com.ruxpress.domain.chat.entity.SenderType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ChatMessageResponse {

    private final String id;
    private final String roomId;
    private final Long senderId;
    private final SenderType senderType;
    private final String content;
    private final ChatMessageType messageType;
    private final AttachmentResponse attachment;
    private final boolean read;
    private final LocalDateTime createdAt;

    private ChatMessageResponse(ChatMessage m, AttachmentResponse attachment) {
        this.id = m.getId();
        this.roomId = m.getRoomId();
        this.senderId = m.getSenderId();
        this.senderType = m.getSenderType();
        this.content = m.getContent();
        this.messageType = m.getMessageType();
        this.attachment = attachment;
        this.read = m.isRead();
        this.createdAt = m.getCreatedAt();
    }

    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(m, null);
    }

    public static ChatMessageResponse from(ChatMessage m, Attachment attachment, FileStoragePort fileStoragePort) {
        AttachmentResponse attachmentResponse = attachment == null ? null : toAttachmentResponse(attachment, fileStoragePort);
        return new ChatMessageResponse(m, attachmentResponse);
    }

    private static AttachmentResponse toAttachmentResponse(Attachment a, FileStoragePort fileStoragePort) {
        return new AttachmentResponse(
                a.getId(),
                a.getOriginalFilename(),
                a.getStoredUrl(),
                a.getThumbnailUrl(),
                fileStoragePort.getViewUrl(a.getStoredUrl()),
                a.getFileSize(),
                a.getMimeType(),
                a.isUploadedByAdmin()
        );
    }
}
