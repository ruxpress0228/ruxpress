package com.ruxpress.domain.chat.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.chat.dto.response.ChatMessageResponse;
import com.ruxpress.domain.chat.dto.response.ChatRoomResponse;
import com.ruxpress.domain.chat.entity.SenderType;
import com.ruxpress.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class UserChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @PostMapping("/rooms")
    public ApiResponse<ChatRoomResponse> getOrCreateRoom(HttpServletRequest request) {
        Long userId = jwtUtil.getUserId(request);
        return ApiResponse.success(chatService.getOrCreateRoom(userId));
    }

    @GetMapping("/rooms")
    public ApiResponse<List<ChatRoomResponse>> listRooms(HttpServletRequest request) {
        Long userId = jwtUtil.getUserId(request);
        return ApiResponse.success(chatService.getUserRooms(userId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getMessages(HttpServletRequest request, @PathVariable String roomId) {
        Long userId = jwtUtil.getUserId(request);
        return ApiResponse.success(chatService.getMessages(roomId, userId, false));
    }

    @PostMapping(value = "/rooms/{roomId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ChatMessageResponse> uploadAttachment(
            HttpServletRequest request,
            @PathVariable String roomId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        Long userId = jwtUtil.getUserId(request);
        return ApiResponse.success(chatService.uploadAttachment(
                roomId, userId, SenderType.USER, file, caption));
    }
}
