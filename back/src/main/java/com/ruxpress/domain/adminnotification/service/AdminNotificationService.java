package com.ruxpress.domain.adminnotification.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.admin.entity.Admin;
import com.ruxpress.domain.admin.entity.AdminRole;
import com.ruxpress.domain.admin.entity.AdminStatus;
import com.ruxpress.domain.admin.repository.AdminRepository;
import com.ruxpress.domain.adminnotification.dto.response.AdminNotificationResponse;
import com.ruxpress.domain.adminnotification.dto.response.AdminNotificationSummaryResponse;
import com.ruxpress.domain.adminnotification.entity.AdminNotification;
import com.ruxpress.domain.adminnotification.entity.AdminNotificationType;
import com.ruxpress.domain.adminnotification.repository.AdminNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminNotificationService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 100;

    private final AdminNotificationRepository notificationRepository;
    private final AdminRepository adminRepository;

    // ─── Triggers ────────────────────────────────────────────────────────

    public void notifyNewPurchaseRequest(Long purchaseRequestId, String requestName) {
        List<Long> adminIds = findActiveAdminIds(Set.of(AdminRole.SUPER_ADMIN));
        if (adminIds.isEmpty()) {
            return;
        }
        String safeName = (requestName == null || requestName.isBlank()) ? "(제목 없음)" : requestName;
        String title = "새 구매 요청";
        String body = String.format("새로운 구매 요청이 등록되었습니다: %s (#%d)", safeName, purchaseRequestId);
        String dataJson = String.format("{\"purchaseRequestId\":%d}", purchaseRequestId);
        String linkUrl = String.format("/admin/purchase-requests/%d", purchaseRequestId);
        fanOutAndSave(adminIds, AdminNotificationType.NEW_PURCHASE_REQUEST, title, body, dataJson, linkUrl);
    }

    public void notifyNewDepositReport(Long entryId, BigDecimal amount, String currency) {
        List<Long> adminIds = findActiveAdminIds(Set.of(AdminRole.SUPER_ADMIN, AdminRole.COUNSELOR));
        if (adminIds.isEmpty()) {
            return;
        }
        String amountStr = amount != null ? amount.toPlainString() : "0";
        String cur = (currency == null || currency.isBlank()) ? "" : (" " + currency);
        String title = "새 입금 신고";
        String body = String.format("%s%s 입금 신고가 접수되었습니다. (#%d)", amountStr, cur, entryId);
        String dataJson = String.format("{\"entryId\":%d}", entryId);
        String linkUrl = "/admin/bank-transfers";
        fanOutAndSave(adminIds, AdminNotificationType.NEW_DEPOSIT_REPORT, title, body, dataJson, linkUrl);
    }

    public void notifyNewInquiry(Long inquiryId, String inquiryTitle) {
        List<Long> adminIds = findActiveAdminIds(Set.of(AdminRole.SUPER_ADMIN, AdminRole.COUNSELOR));
        if (adminIds.isEmpty()) {
            return;
        }
        String safeTitle = (inquiryTitle == null || inquiryTitle.isBlank()) ? "(제목 없음)" : inquiryTitle;
        String title = "새 1:1 문의";
        String body = String.format("새로운 문의가 등록되었습니다: %s (#%d)", safeTitle, inquiryId);
        String dataJson = String.format("{\"inquiryId\":%d}", inquiryId);
        String linkUrl = "/admin/inquiries";
        fanOutAndSave(adminIds, AdminNotificationType.NEW_INQUIRY, title, body, dataJson, linkUrl);
    }

    // ─── Queries ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminNotificationSummaryResponse getSummary(Long adminId, Integer limit) {
        int size = normalizeLimit(limit);
        long unreadCount = notificationRepository.countByAdminIdAndReadFlagFalse(adminId);
        List<AdminNotificationResponse> items = notificationRepository
                .findByAdminIdOrderByCreatedAtDesc(adminId, PageRequest.of(0, size))
                .stream()
                .map(AdminNotificationResponse::from)
                .toList();
        return new AdminNotificationSummaryResponse(unreadCount, items);
    }

    public void markRead(Long adminId, Long notificationId) {
        AdminNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!notification.getAdminId().equals(adminId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        notification.markRead();
    }

    public int markAllRead(Long adminId) {
        return notificationRepository.markAllReadByAdminId(adminId, LocalDateTime.now());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private void fanOutAndSave(
            List<Long> adminIds,
            AdminNotificationType type,
            String title,
            String body,
            String dataJson,
            String linkUrl) {
        List<AdminNotification> batch = adminIds.stream()
                .map(adminId -> AdminNotification.create(adminId, type, title, body, dataJson, linkUrl))
                .toList();
        notificationRepository.saveAll(batch);
        log.debug("Admin notification fan-out type={} count={}", type, batch.size());
    }

    private List<Long> findActiveAdminIds(Collection<AdminRole> roles) {
        return adminRepository
                .findByRoleInAndStatusAndDeletedAtIsNull(roles, AdminStatus.ACTIVE)
                .stream()
                .map(Admin::getId)
                .toList();
    }

    private int normalizeLimit(Integer requested) {
        if (requested == null || requested <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(requested, MAX_LIMIT);
    }
}
