package com.ruxpress.domain.notice.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.notice.dto.response.NoticeResponse;
import com.ruxpress.domain.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ApiResponse<PageResponse<NoticeResponse>> listPublished(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(noticeService.getPublishedNotices(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<NoticeResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.success(noticeService.getNoticeDetail(id));
    }
}
