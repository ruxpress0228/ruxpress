package com.ruxpress.domain.inquiry.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "reply_templates")
public class ReplyTemplate extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private InquiryCategory category;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    public static ReplyTemplate create(String title, String content, InquiryCategory category, int sortOrder) {
        ReplyTemplate t = new ReplyTemplate();
        t.title = title;
        t.content = content;
        t.category = category;
        t.sortOrder = sortOrder;
        return t;
    }

    public void update(String title, String content, InquiryCategory category, int sortOrder) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.sortOrder = sortOrder;
    }
}
