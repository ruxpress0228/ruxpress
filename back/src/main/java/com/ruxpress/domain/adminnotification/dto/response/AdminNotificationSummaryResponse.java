package com.ruxpress.domain.adminnotification.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AdminNotificationSummaryResponse {

    private final long unreadCount;
    private final long totalElements;
    private final List<AdminNotificationResponse> items;
}
