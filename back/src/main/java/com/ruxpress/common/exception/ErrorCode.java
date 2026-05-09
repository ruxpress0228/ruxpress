package com.ruxpress.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_INPUT(400, "error.invalid_input"),
    FILE_SIZE_EXCEEDED(400, "error.file_size_exceeded"),
    FILE_COUNT_EXCEEDED(400, "error.file_count_exceeded"),
    INVALID_VERIFICATION_CODE(400, "error.invalid_verification_code"),
    VERIFICATION_EXPIRED(400, "error.verification_expired"),
    TOO_MANY_VERIFICATION_ATTEMPTS(400, "error.too_many_verification_attempts"),
    VERIFICATION_NOT_FOUND(400, "error.verification_not_found"),
    EMAIL_VERIFICATION_REQUIRED(400, "error.email_verification_required"),
    DUPLICATE_EMAIL(409, "error.duplicate_email"),
    EMAIL_SEND_FAILED(500, "error.email_send_failed"),
    UNAUTHORIZED(401, "error.unauthorized"),
    FORBIDDEN(403, "error.forbidden"),
    INQUIRY_ACCESS_DENIED(403, "error.inquiry_access_denied"),
    NOT_FOUND(404, "error.not_found"),
    INQUIRY_NOT_FOUND(404, "error.inquiry_not_found"),
    INTERNAL_ERROR(500, "error.internal"),
    FILE_UPLOAD_FAILED(500, "error.file_upload_failed"),
    BANK_LEDGER_NOT_FOUND(404, "error.bank_ledger_not_found"),
    SETTLEMENT_ACCOUNT_NOT_FOUND(404, "error.settlement_account_not_found"),
    INVALID_LEDGER_STATE(400, "error.invalid_ledger_state"),
    CONCURRENT_UPDATE(409, "error.concurrent_update"),
    LEDGER_AMOUNT_INVALID(400, "error.ledger_amount_invalid"),
    DUPLICATE_IDEMPOTENCY_KEY(409, "error.duplicate_idempotency_key"),
    CHAT_ROOM_NOT_FOUND(404, "error.chat_room_not_found"),
    CHAT_ACCESS_DENIED(403, "error.chat_access_denied"),
    CHAT_ROOM_CLOSED(400, "error.chat_room_closed");

    private final int status;
    private final String messageKey;
}
