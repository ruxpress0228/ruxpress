package com.ruxpress.domain.inquiry.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "inquiries")
public class Inquiry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InquiryCategory category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InquiryStatus status = InquiryStatus.PENDING;

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<InquiryReply> replies = new ArrayList<>();

    public static Inquiry create(Long userId, InquiryCategory category, String title, String content) {
        Inquiry inquiry = new Inquiry();
        inquiry.userId = userId;
        inquiry.category = category;
        inquiry.title = title;
        inquiry.content = content;
        inquiry.status = InquiryStatus.PENDING;
        return inquiry;
    }

    public void markAsReplied() {
        if (this.status != InquiryStatus.CLOSED) {
            this.status = InquiryStatus.REPLIED;
        }
    }

    public void changeStatus(InquiryStatus newStatus) {
        this.status = newStatus;
    }
}
