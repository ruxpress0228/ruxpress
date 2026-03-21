package com.ruxpress.domain.inquiry.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.inquiry.dto.request.InquiryReplyCreateRequest;
import com.ruxpress.domain.inquiry.dto.request.InquiryStatusChangeRequest;
import com.ruxpress.domain.inquiry.dto.response.AdminInquiryListResponse;
import com.ruxpress.domain.inquiry.dto.response.InquiryResponse;
import com.ruxpress.domain.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ApiResponse<PageResponse<AdminInquiryListResponse>> listInquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(inquiryService.getAllInquiriesForAdmin(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<InquiryResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.success(inquiryService.getInquiryDetailForAdmin(id));
    }

    @PostMapping("/{id}/replies")
    public ApiResponse<InquiryResponse> addReply(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody InquiryReplyCreateRequest request) {
        Long adminId = auth != null ? (Long) auth.getPrincipal() : 1L;
        return ApiResponse.success(inquiryService.addAdminReply(adminId, id, request.getContent()));
    }

    @PutMapping("/{id}/replies/{replyId}")
    public ApiResponse<InquiryResponse> updateReply(
            @PathVariable Long id,
            @PathVariable Long replyId,
            @Valid @RequestBody InquiryReplyCreateRequest request) {
        return ApiResponse.success(inquiryService.updateAdminReply(id, replyId, request.getContent()));
    }

    @DeleteMapping("/{id}/replies/{replyId}")
    public ApiResponse<InquiryResponse> deleteReply(
            @PathVariable Long id,
            @PathVariable Long replyId) {
        return ApiResponse.success(inquiryService.deleteAdminReply(id, replyId));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<InquiryResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody InquiryStatusChangeRequest request) {
        return ApiResponse.success(inquiryService.changeInquiryStatus(id, request.getStatus()));
    }
}
