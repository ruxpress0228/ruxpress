package com.ruxpress.domain.admin.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.admin.dto.response.DashboardStatsResponse;
import com.ruxpress.domain.inquiry.entity.InquiryStatus;
import com.ruxpress.domain.inquiry.repository.InquiryRepository;
import com.ruxpress.domain.notice.repository.NoticeRepository;
import com.ruxpress.domain.user.entity.UserStatus;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final UserRepository userRepository;
    private final InquiryRepository inquiryRepository;
    private final NoticeRepository noticeRepository;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardStatsResponse> dashboard() {
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long newUsersToday = userRepository.countByCreatedAtAfterAndDeletedAtIsNull(
                LocalDate.now().atStartOfDay());
        long totalInquiries = inquiryRepository.countByDeletedAtIsNull();
        long pendingInquiries = inquiryRepository.countByStatusAndDeletedAtIsNull(InquiryStatus.PENDING);
        long totalNotices = noticeRepository.countByDeletedAtIsNull();

        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .totalInquiries(totalInquiries)
                .pendingInquiries(pendingInquiries)
                .totalNotices(totalNotices)
                .build();

        return ApiResponse.success(stats);
    }
}
