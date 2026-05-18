package com.ruxpress.domain.chat.repository;

import com.ruxpress.domain.chat.entity.ChatRoom;
import com.ruxpress.domain.chat.entity.ChatRoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {

    Optional<ChatRoom> findByUserIdAndStatus(Long userId, ChatRoomStatus status);

    List<ChatRoom> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Page<ChatRoom> findAllByOrderByUpdatedAtDesc(Pageable pageable);
}
