package com.ruxpress.domain.inquiry.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ruxpress.domain.inquiry.service.InquiryService;

// TODO: Inquiry API 엔드포인트 구현
@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
}
