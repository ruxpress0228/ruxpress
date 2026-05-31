package com.ruxpress.domain.chat.repository;

import com.ruxpress.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(String roomId);

    List<ChatMessage> findTop500ByCreatedAtBeforeOrderByCreatedAtAsc(LocalDateTime before);
}
