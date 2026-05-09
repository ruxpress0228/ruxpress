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
@Table(name = "chat_room")
public class ChatRoom {

    @Id
    @Column(name = "chat_room_id", length = 12)
    private String id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "admin_id")
    private Long adminId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ChatRoomStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static ChatRoom create(Long userId) {
        ChatRoom r = new ChatRoom();
        r.id = "CR" + String.format("%010d", ThreadLocalRandom.current().nextLong(10_000_000_000L));
        r.userId = userId;
        r.status = ChatRoomStatus.OPEN;
        r.createdAt = LocalDateTime.now();
        r.updatedAt = LocalDateTime.now();
        return r;
    }

    public void assignAdmin(Long adminId) {
        this.adminId = adminId;
        this.updatedAt = LocalDateTime.now();
    }

    public void close() {
        this.status = ChatRoomStatus.CLOSED;
        this.updatedAt = LocalDateTime.now();
    }

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
