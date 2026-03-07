package com.ruxpress.common.repository;

import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByRefTypeAndRefIdOrderBySortOrder(AttachmentRefType refType, Long refId);
}
