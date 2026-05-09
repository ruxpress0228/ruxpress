package com.ruxpress.domain.chat.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.chat.dto.response.ChatMessageResponse;
import com.ruxpress.domain.chat.dto.response.ChatRoomResponse;
import com.ruxpress.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class UserChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @PostMapping("/rooms")
    public ApiResponse<ChatRoomResponse> getOrCreateRoom(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Long userId = requireUserId(authorization);
        return ApiResponse.success(chatService.getOrCreateRoom(userId));
    }

    @GetMapping("/rooms")
    public ApiResponse<List<ChatRoomResponse>> listRooms(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Long userId = requireUserId(authorization);
        return ApiResponse.success(chatService.getUserRooms(userId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getMessages(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @PathVariable String roomId) {
        Long userId = requireUserId(authorization);
        return ApiResponse.success(chatService.getMessages(roomId, userId, false));
    }

    private Long requireUserId(String authorization) {
        Long userId = jwtUtil.resolveUserIdFromAuthorizationHeader(authorization);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
