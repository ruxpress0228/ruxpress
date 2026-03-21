package com.ruxpress.domain.inquiry.repository;

import com.ruxpress.domain.inquiry.entity.InquiryReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryReplyRepository extends JpaRepository<InquiryReply, Long> {

    List<InquiryReply> findByInquiry_IdAndDeletedAtIsNullOrderByCreatedAtAsc(Long inquiryId);
}
