package com.ruxpress.domain.adminnotification.dto.response;

import com.ruxpress.domain.adminnotification.entity.AdminNotification;
import com.ruxpress.domain.adminnotification.entity.AdminNotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminNotificationResponse {

    private final Long id;
    private final AdminNotificationType type;
    private final String title;
    private final String body;
    private final String dataJson;
    private final String linkUrl;
    private final boolean isRead;
    private final LocalDateTime readAt;
    private final LocalDateTime createdAt;

    public static AdminNotificationResponse from(AdminNotification n) {
        return new AdminNotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getBody(),
                n.getDataJson(),
                n.getLinkUrl(),
                n.isReadFlag(),
                n.getReadAt(),
                n.getCreatedAt());
    }
}
