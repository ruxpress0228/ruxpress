package com.ruxpress.domain.notice.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.notice.dto.request.NoticeCreateRequest;
import com.ruxpress.domain.notice.dto.request.NoticeUpdateRequest;
import com.ruxpress.domain.notice.dto.response.NoticeResponse;
import com.ruxpress.domain.notice.entity.Notice;
import com.ruxpress.domain.notice.entity.NoticeStatus;
import com.ruxpress.domain.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    // ─── Admin ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<NoticeResponse> getAllNoticesForAdmin(Pageable pageable) {
        Page<Notice> page = noticeRepository.findByDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(pageable);
        List<NoticeResponse> content = page.getContent().stream().map(NoticeResponse::from).collect(Collectors.toList());
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional
    public NoticeResponse createNotice(Long adminId, NoticeCreateRequest request) {
        NoticeStatus status = request.getStatus() != null ? request.getStatus() : NoticeStatus.PUBLISHED;
        Notice notice = Notice.create(adminId, request.getTitle(), request.getContent(),
                request.isPinned(), status, request.getPublishedAt());
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse updateNotice(Long noticeId, NoticeUpdateRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        notice.update(request.getTitle(), request.getContent(), request.isPinned());
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    @Transactional
    public void deleteNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        notice.markDeleted();
        noticeRepository.save(notice);
    }

    @Transactional
    public NoticeResponse togglePin(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        notice.togglePin();
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    // ─── User-facing ──────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<NoticeResponse> getPublishedNotices(Pageable pageable) {
        Page<Notice> page = noticeRepository.findByStatusAndDeletedAtIsNullOrderByIsPinnedDescPublishedAtDesc(
                NoticeStatus.PUBLISHED, pageable);
        List<NoticeResponse> content = page.getContent().stream().map(NoticeResponse::from).collect(Collectors.toList());
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional
    public NoticeResponse getNoticeDetail(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        notice.incrementViewCount();
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    // ─── Scheduled publishing ─────────────────────────────

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void publishScheduledNotices() {
        List<Notice> ready = noticeRepository.findByStatusAndPublishedAtBeforeAndDeletedAtIsNull(
                NoticeStatus.SCHEDULED, LocalDateTime.now());
        for (Notice notice : ready) {
            notice.publish();
            noticeRepository.save(notice);
            log.info("Scheduled notice published: id={}, title={}", notice.getId(), notice.getTitle());
        }
    }
}
