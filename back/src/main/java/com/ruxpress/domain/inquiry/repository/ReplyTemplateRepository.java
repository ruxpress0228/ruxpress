package com.ruxpress.domain.inquiry.repository;

import com.ruxpress.domain.inquiry.entity.ReplyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReplyTemplateRepository extends JpaRepository<ReplyTemplate, Long> {

    List<ReplyTemplate> findByDeletedAtIsNullOrderBySortOrderAscCreatedAtDesc();
}
