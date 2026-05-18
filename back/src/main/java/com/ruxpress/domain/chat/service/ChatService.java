package com.ruxpress.domain.chat.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.chat.dto.response.ChatMessageResponse;
import com.ruxpress.domain.chat.dto.response.ChatRoomResponse;
import com.ruxpress.domain.chat.entity.ChatMessage;
import com.ruxpress.domain.chat.entity.ChatRoom;
import com.ruxpress.domain.chat.entity.ChatRoomStatus;
import com.ruxpress.domain.chat.entity.SenderType;
import com.ruxpress.domain.chat.repository.ChatMessageRepository;
import com.ruxpress.domain.chat.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatRoomResponse getOrCreateRoom(Long userId) {
        return chatRoomRepository.findByUserIdAndStatus(userId, ChatRoomStatus.OPEN)
                .map(ChatRoomResponse::from)
                .orElseGet(() -> ChatRoomResponse.from(chatRoomRepository.save(ChatRoom.create(userId))));
    }

    public List<ChatRoomResponse> getUserRooms(Long userId) {
        return chatRoomRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(ChatRoomResponse::from)
                .toList();
    }

    public List<ChatMessageResponse> getMessages(String roomId, Long requesterId, boolean isAdmin) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        if (!isAdmin && !room.getUserId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.CHAT_ACCESS_DENIED);
        }
        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public void processMessage(String roomId, Long senderId, SenderType senderType, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));

        if (room.getStatus() == ChatRoomStatus.CLOSED) {
            throw new BusinessException(ErrorCode.CHAT_ROOM_CLOSED);
        }
        if (senderType == SenderType.USER && !room.getUserId().equals(senderId)) {
            throw new BusinessException(ErrorCode.CHAT_ACCESS_DENIED);
        }
        if (senderType == SenderType.ADMIN && room.getAdminId() == null) {
            room.assignAdmin(senderId);
        }
        room.touch();

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.create(roomId, senderId, senderType, content)
        );

        // TODO (Kafka phase 2): publish ChatMessageEvent to Kafka topic instead of direct broadcast
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, ChatMessageResponse.from(message));
    }

    public PageResponse<ChatRoomResponse> listAllRooms(Pageable pageable) {
        Page<ChatRoomResponse> page = chatRoomRepository.findAllByOrderByUpdatedAtDesc(pageable)
                .map(ChatRoomResponse::from);
        return new PageResponse<>(page.getContent(), page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional
    public ChatRoomResponse adminJoinRoom(String roomId, Long adminId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        if (room.getStatus() == ChatRoomStatus.CLOSED) {
            throw new BusinessException(ErrorCode.CHAT_ROOM_CLOSED);
        }
        room.assignAdmin(adminId);
        return ChatRoomResponse.from(room);
    }

    @Transactional
    public ChatRoomResponse closeRoom(String roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        room.close();
        return ChatRoomResponse.from(room);
    }
}
