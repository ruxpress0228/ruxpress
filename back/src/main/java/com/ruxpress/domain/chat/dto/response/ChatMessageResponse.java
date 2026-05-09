package com.ruxpress.domain.chat.dto.response;

import com.ruxpress.domain.chat.entity.ChatMessage;
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
    private final boolean read;
    private final LocalDateTime createdAt;

    private ChatMessageResponse(ChatMessage m) {
        this.id = m.getId();
        this.roomId = m.getRoomId();
        this.senderId = m.getSenderId();
        this.senderType = m.getSenderType();
        this.content = m.getContent();
        this.read = m.isRead();
        this.createdAt = m.getCreatedAt();
    }

    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(m);
    }
}
