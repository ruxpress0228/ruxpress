package com.ruxpress.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_INPUT(400, "error.invalid_input"),
    FILE_SIZE_EXCEEDED(400, "error.file_size_exceeded"),
    FILE_COUNT_EXCEEDED(400, "error.file_count_exceeded"),
    UNAUTHORIZED(401, "error.unauthorized"),
    FORBIDDEN(403, "error.forbidden"),
    INQUIRY_ACCESS_DENIED(403, "error.inquiry_access_denied"),
    NOT_FOUND(404, "error.not_found"),
    INQUIRY_NOT_FOUND(404, "error.inquiry_not_found"),
    INTERNAL_ERROR(500, "error.internal"),
    FILE_UPLOAD_FAILED(500, "error.file_upload_failed");

    private final int status;
    private final String messageKey;
}
