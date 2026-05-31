package com.ruxpress.domain.notification.service;

import com.ruxpress.domain.notification.entity.Notification;
import com.ruxpress.domain.notification.entity.NotificationType;
import com.ruxpress.domain.notification.repository.NotificationRepository;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.integration.kafka.PushKafkaOutboxService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PushKafkaOutboxService pushKafkaOutboxService;

    public void notifyBankDepositConfirmed(Long userId, Long entryId, BigDecimal amount) {
        String body = String.format("입금 #%d 금액 %s원이 확인되었습니다.", entryId, amount.toPlainString());
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.BANK_DEPOSIT,
                "입금 확인 완료",
                body,
                "{\"entryId\":" + entryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifySettled(Long userId, Long entryId, Long parentEntryId, BigDecimal amount) {
        String body = String.format("입금 #%d 정산 금액 %s원이 처리되었습니다. (원 건 #%d)", entryId, amount.toPlainString(), parentEntryId);
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.BANK_DEPOSIT,
                "정산 완료",
                body,
                "{\"entryId\":" + entryId + ",\"parentEntryId\":" + parentEntryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyRefunded(Long userId, Long entryId, Long parentEntryId, BigDecimal amount) {
        String body = String.format("입금 #%d 환불 금액 %s원이 처리되었습니다. (원 건 #%d)", entryId, amount.toPlainString(), parentEntryId);
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.BANK_DEPOSIT,
                "환불 완료",
                body,
                "{\"entryId\":" + entryId + ",\"parentEntryId\":" + parentEntryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyWalletPurchaseAdjustment(Long userId, Long purchaseRequestId, BigDecimal amount) {
        String body = String.format("구매 요청 #%d 관련 잔액 %s원이 지갑으로 환급되었습니다.", purchaseRequestId, amount.toPlainString());
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.BALANCE,
                "구매 차액 환급",
                body,
                "{\"purchaseRequestId\":" + purchaseRequestId + ",\"amount\":\"" + amount.toPlainString() + "\"}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyChatMessageFromAdmin(Long userId, String roomId, String content) {
        String preview = previewBody(content);
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.CHAT,
                "RuxPress 관리자",
                preview,
                "{\"roomId\":\"" + escapeJson(roomId) + "\"}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyChatRoomClosed(Long userId, String roomId) {
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.CHAT,
                "채팅 종료",
                "관리자가 상담을 종료했습니다. 새 상담은 채팅 메뉴에서 다시 시작할 수 있습니다.",
                "{\"roomId\":\"" + escapeJson(roomId) + "\",\"event\":\"ROOM_CLOSED\"}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyPurchaseStatusChanged(Long userId, Long purchaseRequestId, String requestNumber,
                                            PurchaseRequestStatus newStatus) {
        String body = String.format("구매 요청 %s 상태가 '%s'(으)로 변경되었습니다.",
                requestNumber, koreanStatus(newStatus));
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.PURCHASE_STATUS,
                "구매 요청 상태 변경",
                body,
                "{\"purchaseRequestId\":" + purchaseRequestId + ",\"status\":\"" + newStatus.name() + "\"}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyInquiryReply(Long userId, Long inquiryId, String inquiryTitle) {
        String body = String.format("'%s' 문의에 답변이 등록되었습니다.", inquiryTitle);
        Notification saved = notificationRepository.saveAndFlush(Notification.create(
                userId,
                NotificationType.INQUIRY_REPLY,
                "문의 답변 도착",
                body,
                "{\"inquiryId\":" + inquiryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    private static String previewBody(String content) {
        if (content == null) {
            return "";
        }
        String trimmed = content.strip();
        if (trimmed.length() <= 100) {
            return trimmed;
        }
        return trimmed.substring(0, 100) + "…";
    }

    private static String koreanStatus(PurchaseRequestStatus status) {
        return switch (status) {
            case REQUESTED -> "요청접수";
            case PURCHASING -> "구매진행중";
            case SHIPPING -> "배송중";
            case COMPLETED -> "완료";
            case CANCELLED -> "취소";
        };
    }

    private static String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
