package com.ruxpress.domain.chat.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "chat_message")
public class ChatMessage {

    @Id
    @Column(name = "chat_message_id", length = 12)
    private String id;

    @Column(name = "chat_room_id", nullable = false, length = 12)
    private String roomId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 16)
    private SenderType senderType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static ChatMessage create(String roomId, Long senderId, SenderType senderType, String content) {
        ChatMessage m = new ChatMessage();
        m.id = "CM" + String.format("%010d", ThreadLocalRandom.current().nextLong(10_000_000_000L));
        m.roomId = roomId;
        m.senderId = senderId;
        m.senderType = senderType;
        m.content = content;
        m.read = false;
        m.createdAt = LocalDateTime.now();
        return m;
    }
}
