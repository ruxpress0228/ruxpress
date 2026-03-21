package com.ruxpress.domain.notice.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "notices")
public class Notice extends BaseEntity {

    @Column(name = "admin_id")
    private Long adminId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_pinned", nullable = false)
    private boolean isPinned = false;

    @Column(name = "view_count", nullable = false)
    private int viewCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoticeStatus status = NoticeStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    public static Notice create(Long adminId, String title, String content, boolean isPinned,
                                NoticeStatus status, LocalDateTime publishedAt) {
        Notice n = new Notice();
        n.adminId = adminId;
        n.title = title;
        n.content = content;
        n.isPinned = isPinned;
        n.status = status;
        if (status == NoticeStatus.PUBLISHED) {
            n.publishedAt = LocalDateTime.now();
        } else if (status == NoticeStatus.SCHEDULED && publishedAt != null) {
            n.publishedAt = publishedAt;
        }
        return n;
    }

    public void update(String title, String content, boolean isPinned) {
        this.title = title;
        this.content = content;
        this.isPinned = isPinned;
    }

    public void togglePin() {
        this.isPinned = !this.isPinned;
    }

    public void publish() {
        this.status = NoticeStatus.PUBLISHED;
        if (this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    public void incrementViewCount() {
        this.viewCount++;
    }
}
