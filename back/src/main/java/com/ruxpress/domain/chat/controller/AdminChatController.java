package com.ruxpress.domain.chat.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.chat.dto.response.ChatMessageResponse;
import com.ruxpress.domain.chat.dto.response.ChatRoomResponse;
import com.ruxpress.domain.chat.entity.SenderType;
import com.ruxpress.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/chat")
@RequiredArgsConstructor
public class AdminChatController {

    private final ChatService chatService;

    @GetMapping("/rooms")
    public ApiResponse<PageResponse<ChatRoomResponse>> listRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(chatService.listAllRooms(PageRequest.of(page, size)));
    }

    @PatchMapping("/rooms/{roomId}/join")
    public ApiResponse<ChatRoomResponse> joinRoom(
            @PathVariable String roomId,
            Authentication authentication) {
        Long adminId = (Long) authentication.getPrincipal();
        return ApiResponse.success(chatService.adminJoinRoom(roomId, adminId));
    }

    @PatchMapping("/rooms/{roomId}/close")
    public ApiResponse<ChatRoomResponse> closeRoom(@PathVariable String roomId) {
        return ApiResponse.success(chatService.closeRoom(roomId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getMessages(@PathVariable String roomId) {
        return ApiResponse.success(chatService.getMessages(roomId, null, true));
    }

    @PostMapping(value = "/rooms/{roomId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ChatMessageResponse> uploadAttachment(
            @PathVariable String roomId,
            Authentication authentication,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        Long adminId = (Long) authentication.getPrincipal();
        return ApiResponse.success(chatService.uploadAttachment(
                roomId, adminId, SenderType.ADMIN, file, caption));
    }
}
