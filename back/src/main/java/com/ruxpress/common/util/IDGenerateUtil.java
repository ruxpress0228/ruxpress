package com.ruxpress.common.util;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.UUID;

public final class IDGenerateUtil {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int TARGET_LENGTH = 30;

    /** 구매 요청 번호 등에 사용하는 prefix */
    public static final String PURCHASE_REQUEST_PREFIX = "PR";

    private IDGenerateUtil() {
    }

    /**
     * prefix + 타임스탬프(yyyyMMddHHmmss) + UUID(하이픈 제거) 조합, 최대 30자로 절단.
     * 설계 목적 UUID 를 사용하여 중복 방지 + 시간 정보 포함
     */
    public static String generateNumber(String prefix) {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        String uuidPart = UUID.randomUUID().toString().replace("-", "");
        String base = prefix + timestamp + uuidPart;
        if (base.length() <= TARGET_LENGTH) {
            return base;
        }
        return base.substring(0, TARGET_LENGTH);
    }

    public static String generatePurchaseRequestNumber() {
        return generateNumber(PURCHASE_REQUEST_PREFIX);
    }
}
