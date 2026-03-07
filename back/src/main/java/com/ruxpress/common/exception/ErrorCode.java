package com.ruxpress.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_INPUT(400, "error.invalid_input"),
    INVALID_VERIFICATION_CODE(400, "error.invalid_verification_code"),
    VERIFICATION_EXPIRED(400, "error.verification_expired"),
    TOO_MANY_VERIFICATION_ATTEMPTS(400, "error.too_many_verification_attempts"),
    VERIFICATION_NOT_FOUND(400, "error.verification_not_found"),
    EMAIL_VERIFICATION_REQUIRED(400, "error.email_verification_required"),
    DUPLICATE_EMAIL(409, "error.duplicate_email"),
    EMAIL_SEND_FAILED(500, "error.email_send_failed"),
    UNAUTHORIZED(401, "error.unauthorized"),
    FORBIDDEN(403, "error.forbidden"),
    NOT_FOUND(404, "error.not_found"),
    INTERNAL_ERROR(500, "error.internal");

    private final int status;
    private final String messageKey;
}
