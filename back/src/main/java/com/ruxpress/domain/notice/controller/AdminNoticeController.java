package com.ruxpress.domain.notice.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.notice.dto.request.NoticeCreateRequest;
import com.ruxpress.domain.notice.dto.request.NoticeUpdateRequest;
import com.ruxpress.domain.notice.dto.response.NoticeResponse;
import com.ruxpress.domain.notice.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ApiResponse<PageResponse<NoticeResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(noticeService.getAllNoticesForAdmin(PageRequest.of(page, size)));
    }

    @PostMapping
    public ApiResponse<NoticeResponse> create(
            Authentication auth,
            @Valid @RequestBody NoticeCreateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(noticeService.createNotice(adminId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<NoticeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody NoticeUpdateRequest request) {
        return ApiResponse.success(noticeService.updateNotice(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/pin")
    public ApiResponse<NoticeResponse> togglePin(@PathVariable Long id) {
        return ApiResponse.success(noticeService.togglePin(id));
    }
}
