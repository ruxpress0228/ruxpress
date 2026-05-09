package com.ruxpress.domain.chat.controller;

import com.ruxpress.config.ChatPrincipal;
import com.ruxpress.domain.chat.dto.request.SendMessageRequest;
import com.ruxpress.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat/{roomId}/send")
    public void handleMessage(
            @DestinationVariable String roomId,
            @Payload @Valid SendMessageRequest request,
            Principal principal) {
        if (!(principal instanceof ChatPrincipal chatPrincipal)) {
            throw new MessagingException("Unauthorized");
        }
        chatService.processMessage(roomId, chatPrincipal.getId(), chatPrincipal.getSenderType(), request.getContent());
    }
}
