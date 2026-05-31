package com.ruxpress.common.exception;

import com.ruxpress.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /** ErrorCode 의 메시지 키를 요청 로케일(Accept-Language)에 맞는 메시지로 변환한다. 키가 없으면 키 문자열을 그대로 반환. */
    private String resolveMessage(ErrorCode errorCode) {
        Locale locale = LocaleContextHolder.getLocale();
        try {
            return messageSource.getMessage(errorCode.getMessageKey(), null, locale);
        } catch (NoSuchMessageException ex) {
            return errorCode.getMessageKey();
        }
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("BusinessException: {}", e.getMessage());
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(errorCode.getStatus(), resolveMessage(errorCode)));
    }

    /** favicon.ico 등 없는 정적 리소스 요청 시 ERROR 로그 방지 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException e) {
        return ResponseEntity.status(404).body(ApiResponse.error(404, "Not Found"));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLock(ObjectOptimisticLockingFailureException e) {
        log.warn("Optimistic lock failure: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.CONCURRENT_UPDATE.getStatus())
                .body(ApiResponse.error(ErrorCode.CONCURRENT_UPDATE.getStatus(), resolveMessage(ErrorCode.CONCURRENT_UPDATE)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        log.warn("Validation failed: {}", message);
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity
                .internalServerError()
                .body(ApiResponse.error(500, "Internal server error"));
    }
}
