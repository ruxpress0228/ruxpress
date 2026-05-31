package com.ruxpress.domain.chat.dto.response;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ChatRoomClosedEvent {

    private final String eventType = "ROOM_CLOSED";
    private final String roomId;
    private final LocalDateTime closedAt;

    private ChatRoomClosedEvent(String roomId, LocalDateTime closedAt) {
        this.roomId = roomId;
        this.closedAt = closedAt;
    }

    public static ChatRoomClosedEvent of(String roomId) {
        return new ChatRoomClosedEvent(roomId, LocalDateTime.now());
    }
}
