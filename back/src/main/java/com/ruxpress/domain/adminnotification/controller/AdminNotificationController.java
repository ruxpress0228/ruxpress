package com.ruxpress.domain.adminnotification.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.adminnotification.dto.response.AdminNotificationSummaryResponse;
import com.ruxpress.domain.adminnotification.service.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    @GetMapping
    public ApiResponse<AdminNotificationSummaryResponse> getSummary(
            Authentication auth,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page) {
        Long adminId = requireAdminId(auth);
        return ApiResponse.success(adminNotificationService.getSummary(adminId, limit, page));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(Authentication auth, @PathVariable Long id) {
        Long adminId = requireAdminId(auth);
        adminNotificationService.markRead(adminId, id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead(Authentication auth) {
        Long adminId = requireAdminId(auth);
        adminNotificationService.markAllRead(adminId);
        return ApiResponse.success(null);
    }

    private Long requireAdminId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long adminId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return adminId;
    }
}
