package com.ruxpress.domain.chat.dto.response;

import com.ruxpress.domain.chat.entity.ChatRoom;
import com.ruxpress.domain.chat.entity.ChatRoomStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ChatRoomResponse {

    private final String id;
    private final Long userId;
    private final Long adminId;
    private final ChatRoomStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    private ChatRoomResponse(ChatRoom r) {
        this.id = r.getId();
        this.userId = r.getUserId();
        this.adminId = r.getAdminId();
        this.status = r.getStatus();
        this.createdAt = r.getCreatedAt();
        this.updatedAt = r.getUpdatedAt();
    }

    public static ChatRoomResponse from(ChatRoom r) {
        return new ChatRoomResponse(r);
    }
}
