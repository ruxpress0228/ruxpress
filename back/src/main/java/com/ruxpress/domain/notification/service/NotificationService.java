package com.ruxpress.domain.notification.service;

import com.ruxpress.domain.notification.entity.Notification;
import com.ruxpress.domain.notification.entity.NotificationType;
import com.ruxpress.domain.notification.repository.NotificationRepository;
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
        Notification saved = notificationRepository.save(Notification.create(
                userId,
                NotificationType.BANK_DEPOSIT,
                "입금 확인 완료",
                body,
                "{\"entryId\":" + entryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyEscrowSettled(Long userId, Long entryId, Long parentEntryId, BigDecimal amount) {
        String body = String.format("거래 #%d 정산 금액 %s원이 처리되었습니다. (원 건 #%d)", entryId, amount.toPlainString(), parentEntryId);
        Notification saved = notificationRepository.save(Notification.create(
                userId,
                NotificationType.ESCROW_STATUS,
                "에스크로 정산 완료",
                body,
                "{\"entryId\":" + entryId + ",\"parentEntryId\":" + parentEntryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyEscrowRefunded(Long userId, Long entryId, Long parentEntryId, BigDecimal amount) {
        String body = String.format("거래 #%d 환불 금액 %s원이 처리되었습니다. (원 건 #%d)", entryId, amount.toPlainString(), parentEntryId);
        Notification saved = notificationRepository.save(Notification.create(
                userId,
                NotificationType.ESCROW_STATUS,
                "에스크로 환불 완료",
                body,
                "{\"entryId\":" + entryId + ",\"parentEntryId\":" + parentEntryId + "}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }

    public void notifyWalletPurchaseAdjustment(Long userId, Long purchaseRequestId, BigDecimal amount) {
        String body = String.format("구매 요청 #%d 관련 잔액 %s원이 지갑으로 환급되었습니다.", purchaseRequestId, amount.toPlainString());
        Notification saved = notificationRepository.save(Notification.create(
                userId,
                NotificationType.BALANCE,
                "구매 차액 환급",
                body,
                "{\"purchaseRequestId\":" + purchaseRequestId + ",\"amount\":\"" + amount.toPlainString() + "\"}"));
        pushKafkaOutboxService.scheduleDispatchAfterCommit(saved);
    }
}
