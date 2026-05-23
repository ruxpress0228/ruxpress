package com.ruxpress.config;

import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.chat.entity.SenderType;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String auth = accessor.getFirstNativeHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new MessagingException("Missing or invalid Authorization header");
        }

        String token = auth.substring(7).trim();
        try {
            if (jwtTokenProvider.validateToken(token)) {
                String role = jwtTokenProvider.getRole(token);
                if (role != null) {
                    Long adminId = jwtTokenProvider.getAdminId(token);
                    accessor.setUser(new ChatPrincipal(adminId, SenderType.ADMIN));
                    return message;
                }
            }
            Claims claims = jwtUtil.parseToken(token);
            Long userId = Long.parseLong(claims.getSubject());
            accessor.setUser(new ChatPrincipal(userId, SenderType.USER));
        } catch (Exception e) {
            log.warn("WebSocket JWT auth failed: {}", e.getMessage());
            throw new MessagingException("Invalid JWT token");
        }

        return message;
    }
}
