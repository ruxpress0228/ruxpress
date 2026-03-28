package com.ruxpress.domain.banktransfer.integration;

/**
 * 향후 PG/은행 Open API 웹훅 처리용 포트. MVP에서는 수동 입금 확인만 사용.
 */
public interface BankDepositVerificationPort {

    /**
     * 검증 실패 시 false.
     */
    boolean verifyWebhookSignature(String rawBody, String signatureHeader);

    /**
     * 입금 알림 페이로드 수신 (파싱·원장 반영은 미구현 스텁 가능).
     */
    void handleIncomingDepositPayload(String rawBody);
}
