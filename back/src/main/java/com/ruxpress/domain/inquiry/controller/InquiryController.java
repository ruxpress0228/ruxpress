package com.ruxpress.domain.inquiry.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.JwtUtil;
import com.ruxpress.domain.inquiry.dto.request.InquiryCreateRequest;
import com.ruxpress.domain.inquiry.dto.response.InquiryListResponse;
import com.ruxpress.domain.inquiry.dto.response.InquiryResponse;
import com.ruxpress.domain.inquiry.service.InquiryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InquiryResponse> createInquiry(
            HttpServletRequest request,
            @RequestPart("inquiry") @Valid InquiryCreateRequest body,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        Long userId = resolveUserId(request);
        InquiryResponse response = inquiryService.createInquiry(userId, body, files);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<PageResponse<InquiryListResponse>> getMyInquiries(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = resolveUserId(request);
        PageResponse<InquiryListResponse> response = inquiryService.getMyInquiries(
                userId, PageRequest.of(page, size));
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<InquiryResponse> getInquiryDetail(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = resolveUserId(request);
        InquiryResponse response = inquiryService.getInquiryDetail(userId, id);
        return ApiResponse.success(response);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            HttpServletRequest request,
            @PathVariable Long attachmentId) {
        Long userId = resolveUserId(request);
        Resource resource = inquiryService.getAttachmentResource(attachmentId, userId);
        String filename = inquiryService.getAttachmentOriginalFilename(attachmentId);
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }

    private Long resolveUserId(HttpServletRequest request) {
        Long userId = JwtUtil.getUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return userId;
    }
}
