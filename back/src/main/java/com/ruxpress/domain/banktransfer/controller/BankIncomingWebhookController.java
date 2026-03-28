package com.ruxpress.domain.banktransfer.controller;

import com.ruxpress.common.dto.ApiResponse;
import com.ruxpress.domain.banktransfer.integration.BankDepositVerificationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 향후 은행/PG 웹훅 엔드포인트. 시크릿 검증은 {@link BankDepositVerificationPort}로 위임.
 */
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class BankIncomingWebhookController {

    private final BankDepositVerificationPort bankDepositVerificationPort;

    @PostMapping("/bank-incoming")
    public ApiResponse<String> bankIncoming(
            @RequestBody(required = false) String rawBody,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature) {
        if (!bankDepositVerificationPort.verifyWebhookSignature(
                rawBody != null ? rawBody : "", signature != null ? signature : "")) {
            return ApiResponse.error(401, "invalid signature");
        }
        bankDepositVerificationPort.handleIncomingDepositPayload(rawBody != null ? rawBody : "");
        return ApiResponse.success("accepted");
    }
}
