package com.ruxpress.common.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "attachments")
@EntityListeners(AuditingEntityListener.class)
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false)
    private AttachmentRefType refType;

    @Column(name = "ref_id", nullable = false)
    private Long refId;

    @Column(name = "original_filename", nullable = false, length = 300)
    private String originalFilename;

    @Column(name = "stored_url", nullable = false, length = 500)
    private String storedUrl;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "file_size", nullable = false)
    private int fileSize;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static Attachment create(AttachmentRefType refType, Long refId, String originalFilename,
                                    String storedUrl, int fileSize, String mimeType, int sortOrder) {
        Attachment attachment = new Attachment();
        attachment.refType = refType;
        attachment.refId = refId;
        attachment.originalFilename = originalFilename;
        attachment.storedUrl = storedUrl;
        attachment.fileSize = fileSize;
        attachment.mimeType = mimeType;
        attachment.sortOrder = sortOrder;
        return attachment;
    }
}
