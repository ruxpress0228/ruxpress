package com.ruxpress.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DashboardStatsResponse {

    private final long totalUsers;
    private final long newUsersToday;
    private final long totalInquiries;
    private final long pendingInquiries;
    private final long totalNotices;
}
