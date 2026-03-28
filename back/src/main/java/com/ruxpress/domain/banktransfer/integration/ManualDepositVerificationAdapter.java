package com.ruxpress.domain.banktransfer.integration;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * MVP: 자동 입금 확인 없음. 관리자 화면에서 수동 확정.
 */
@Component
@Primary
public class ManualDepositVerificationAdapter implements BankDepositVerificationPort {

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        return true;
    }

    @Override
    public void handleIncomingDepositPayload(String rawBody) {
        // PG 연동 시 파싱 후 transfer_ledger_entries 갱신
    }
}
