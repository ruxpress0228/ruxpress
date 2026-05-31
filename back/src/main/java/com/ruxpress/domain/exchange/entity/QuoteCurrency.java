package com.ruxpress.domain.exchange.entity;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;

/**
 * 외화 시세 통화 (1 {code} = rate KRW). KRW는 허브로 DB 행 없음.
 */
public enum QuoteCurrency {
    RUB,
    USD,
    CNY,
    JPY,
    EUR;

    public static QuoteCurrency fromCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "통화 코드가 필요합니다.");
        }
        try {
            return QuoteCurrency.valueOf(code.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "지원하지 않는 통화입니다: " + code);
        }
    }
}
