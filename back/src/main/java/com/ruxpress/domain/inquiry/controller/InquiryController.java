package com.ruxpress.domain.inquiry.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.domain.inquiry.dto.request.InquiryCreateRequest;
import com.ruxpress.domain.inquiry.dto.response.InquiryListResponse;
import com.ruxpress.domain.inquiry.dto.response.InquiryResponse;
import com.ruxpress.domain.inquiry.service.InquiryService;
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
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestPart("inquiry") @Valid InquiryCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        InquiryResponse response = inquiryService.createInquiry(effectiveUserId, request, files);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<PageResponse<InquiryListResponse>> getMyInquiries(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        PageResponse<InquiryListResponse> response = inquiryService.getMyInquiries(
                effectiveUserId, PageRequest.of(page, size));
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<InquiryResponse> getInquiryDetail(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long id) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        InquiryResponse response = inquiryService.getInquiryDetail(effectiveUserId, id);
        return ApiResponse.success(response);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @PathVariable Long attachmentId) {
        Long effectiveUserId = userId != null ? userId : 1L; // TODO: JWT에서 추출
        Resource resource = inquiryService.getAttachmentResource(effectiveUserId, attachmentId);
        String filename = inquiryService.getAttachmentOriginalFilename(attachmentId);
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }
}
