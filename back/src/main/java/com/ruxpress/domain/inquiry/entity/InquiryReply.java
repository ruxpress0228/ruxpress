package com.ruxpress.domain.inquiry.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "inquiry_replies")
public class InquiryReply extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Inquiry inquiry;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    public static InquiryReply create(Inquiry inquiry, Long adminId, String content) {
        InquiryReply reply = new InquiryReply();
        reply.inquiry = inquiry;
        reply.adminId = adminId;
        reply.content = content;
        reply.isRead = false;
        return reply;
    }
}
