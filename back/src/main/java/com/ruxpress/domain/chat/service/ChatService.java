package com.ruxpress.domain.chat.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.util.ModulePrefix;
import com.ruxpress.domain.adminnotification.service.AdminNotificationService;
import com.ruxpress.domain.chat.dto.response.ChatMessageResponse;
import com.ruxpress.domain.chat.dto.response.ChatRoomClosedEvent;
import com.ruxpress.domain.chat.dto.response.ChatRoomResponse;
import com.ruxpress.domain.chat.entity.ChatMessage;
import com.ruxpress.domain.chat.entity.ChatMessageType;
import com.ruxpress.domain.chat.entity.ChatRoom;
import com.ruxpress.domain.chat.entity.ChatRoomStatus;
import com.ruxpress.domain.chat.entity.SenderType;
import com.ruxpress.domain.chat.repository.ChatMessageRepository;
import com.ruxpress.domain.chat.repository.ChatRoomRepository;
import com.ruxpress.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final AdminNotificationService adminNotificationService;

    @Transactional
    public ChatRoomResponse getOrCreateRoom(Long userId) {
        return chatRoomRepository.findByUserIdAndStatus(userId, ChatRoomStatus.OPEN)
                .map(ChatRoomResponse::from)
                .orElseGet(() -> {
                    ChatRoom newRoom = chatRoomRepository.save(ChatRoom.create(userId));
                    adminNotificationService.notifyNewChatRoom(userId, newRoom.getId());
                    return ChatRoomResponse.from(newRoom);
                });
    }

    public List<ChatRoomResponse> getUserRooms(Long userId) {
        return chatRoomRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(ChatRoomResponse::from)
                .toList();
    }

    public List<ChatMessageResponse> getMessages(String roomId, Long requesterId, boolean isAdmin) {
        ChatRoom room = findRoom(roomId);
        assertRoomAccess(room, requesterId, isAdmin);
        List<ChatMessage> messages = chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        return toResponses(messages);
    }

    @Transactional
    public void processMessage(String roomId, Long senderId, SenderType senderType, String content) {
        ChatRoom room = findOpenRoom(roomId);
        assertSenderAccess(room, senderId, senderType);
        assignAdminIfNeeded(room, senderId, senderType);
        room.touch();

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.createText(roomId, senderId, senderType, content)
        );

        publishAndNotify(room, message, null);
    }

    @Transactional
    public ChatMessageResponse uploadAttachment(String roomId, Long senderId, SenderType senderType,
                                                MultipartFile file, String caption) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        ChatRoom room = findOpenRoom(roomId);
        assertSenderAccess(room, senderId, senderType);
        assignAdminIfNeeded(room, senderId, senderType);
        room.touch();

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        ChatMessageType messageType = mimeType.startsWith("image/") ? ChatMessageType.IMAGE : ChatMessageType.FILE;
        String content = caption != null ? caption.trim() : "";

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.createAttachment(roomId, senderId, senderType, content, messageType)
        );

        Attachment attachment;
        try {
            String storedUrl = fileStoragePort.store(ModulePrefix.CHAT, file);
            long refId = parseMessageRefId(message.getId());
            if (senderType == SenderType.ADMIN) {
                attachment = Attachment.createByAdmin(
                        AttachmentRefType.CHAT,
                        refId,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        mimeType,
                        0
                );
            } else {
                attachment = Attachment.create(
                        AttachmentRefType.CHAT,
                        refId,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        mimeType,
                        0
                );
            }
            attachment = attachmentRepository.save(attachment);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
        }

        message.assignAttachment(attachment.getId());
        chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.from(message, attachment, fileStoragePort);
        publishAndNotify(room, message, attachment);
        return response;
    }

    public PageResponse<ChatRoomResponse> listAllRooms(Pageable pageable) {
        Page<ChatRoomResponse> page = chatRoomRepository.findAllByOrderByUpdatedAtDesc(pageable)
                .map(ChatRoomResponse::from);
        return new PageResponse<>(page.getContent(), page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional
    public ChatRoomResponse adminJoinRoom(String roomId, Long adminId) {
        ChatRoom room = findRoom(roomId);
        if (room.getStatus() == ChatRoomStatus.CLOSED) {
            throw new BusinessException(ErrorCode.CHAT_ROOM_CLOSED);
        }
        room.assignAdmin(adminId);
        return ChatRoomResponse.from(room);
    }

    @Transactional
    public ChatRoomResponse closeRoom(String roomId) {
        ChatRoom room = findRoom(roomId);
        if (room.getStatus() == ChatRoomStatus.CLOSED) {
            return ChatRoomResponse.from(room);
        }
        room.close();
        notificationService.notifyChatRoomClosed(room.getUserId(), roomId);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, ChatRoomClosedEvent.of(roomId));
        return ChatRoomResponse.from(room);
    }

    private void publishAndNotify(ChatRoom room, ChatMessage message, Attachment attachment) {
        String preview = notificationPreview(message, attachment);
        if (message.getSenderType() == SenderType.ADMIN) {
            notificationService.notifyChatMessageFromAdmin(room.getUserId(), room.getId(), preview);
        } else {
            adminNotificationService.notifyNewChatMessage(room.getUserId(), room.getId(), preview);
        }

        ChatMessageResponse response = attachment != null
                ? ChatMessageResponse.from(message, attachment, fileStoragePort)
                : ChatMessageResponse.from(message);
        messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), response);
    }

    private String notificationPreview(ChatMessage message, Attachment attachment) {
        if (message.getContent() != null && !message.getContent().isBlank()) {
            return message.getContent();
        }
        if (message.getMessageType() == ChatMessageType.IMAGE) {
            return "[Image]";
        }
        if (attachment != null) {
            return "[File] " + attachment.getOriginalFilename();
        }
        return "[File]";
    }

    private List<ChatMessageResponse> toResponses(List<ChatMessage> messages) {
        Set<Long> attachmentIds = messages.stream()
                .map(ChatMessage::getAttachmentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, Attachment> attachmentMap = new HashMap<>();
        if (!attachmentIds.isEmpty()) {
            attachmentRepository.findAllById(attachmentIds).forEach(a -> attachmentMap.put(a.getId(), a));
        }
        return messages.stream()
                .map(m -> {
                    Attachment att = m.getAttachmentId() != null ? attachmentMap.get(m.getAttachmentId()) : null;
                    return att != null
                            ? ChatMessageResponse.from(m, att, fileStoragePort)
                            : ChatMessageResponse.from(m);
                })
                .toList();
    }

    private ChatRoom findRoom(String roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    private ChatRoom findOpenRoom(String roomId) {
        ChatRoom room = findRoom(roomId);
        if (room.getStatus() == ChatRoomStatus.CLOSED) {
            throw new BusinessException(ErrorCode.CHAT_ROOM_CLOSED);
        }
        return room;
    }

    private void assertRoomAccess(ChatRoom room, Long requesterId, boolean isAdmin) {
        if (!isAdmin && !room.getUserId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.CHAT_ACCESS_DENIED);
        }
    }

    private void assertSenderAccess(ChatRoom room, Long senderId, SenderType senderType) {
        if (senderType == SenderType.USER && !room.getUserId().equals(senderId)) {
            throw new BusinessException(ErrorCode.CHAT_ACCESS_DENIED);
        }
    }

    private void assignAdminIfNeeded(ChatRoom room, Long senderId, SenderType senderType) {
        if (senderType == SenderType.ADMIN && room.getAdminId() == null) {
            room.assignAdmin(senderId);
        }
    }

    private static long parseMessageRefId(String messageId) {
        if (messageId == null || messageId.length() <= 2) {
            return 0L;
        }
        try {
            return Long.parseLong(messageId.substring(2));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
