package com.ruxpress.domain.notice.dto.response;

import com.ruxpress.domain.notice.entity.Notice;
import com.ruxpress.domain.notice.entity.NoticeStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class NoticeResponse {

    private final Long id;
    private final Long adminId;
    private final String title;
    private final String content;
    private final boolean isPinned;
    private final int viewCount;
    private final NoticeStatus status;
    private final LocalDateTime publishedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static NoticeResponse from(Notice n) {
        return new NoticeResponse(
                n.getId(), n.getAdminId(), n.getTitle(), n.getContent(),
                n.isPinned(), n.getViewCount(), n.getStatus(),
                n.getPublishedAt(),
                n.getCreatedAt(), n.getUpdatedAt());
    }
}
