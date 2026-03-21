package com.ruxpress.domain.user.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.user.dto.request.UserStatusChangeRequest;
import com.ruxpress.domain.user.dto.response.UserResponse;
import com.ruxpress.domain.user.dto.response.UserStatsResponse;
import com.ruxpress.domain.user.entity.UserStatus;
import com.ruxpress.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<UserResponse> response = userService.getUsers(keyword, status, PageRequest.of(page, size));
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUserDetail(@PathVariable Long id) {
        return ApiResponse.success(userService.getUserDetail(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<UserResponse> changeUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusChangeRequest request) {
        return ApiResponse.success(userService.changeUserStatus(id, request.getStatus()));
    }

    @GetMapping("/stats")
    public ApiResponse<UserStatsResponse> getUserStats() {
        return ApiResponse.success(userService.getUserStats());
    }
}
