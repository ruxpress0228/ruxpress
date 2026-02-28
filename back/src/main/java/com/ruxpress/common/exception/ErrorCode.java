package com.ruxpress.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_INPUT(400, "error.invalid_input"),
    UNAUTHORIZED(401, "error.unauthorized"),
    FORBIDDEN(403, "error.forbidden"),
    NOT_FOUND(404, "error.not_found"),
    INTERNAL_ERROR(500, "error.internal");

    private final int status;
    private final String messageKey;
}
