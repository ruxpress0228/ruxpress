package com.ruxpress.push.util;

public final class LogTokens {

    private LogTokens() {}

    /** 로그용: FCM 등 장문 토큰 전체를 남기지 않음 */
    public static String maskDeviceToken(String token) {
        if (token == null || token.isEmpty()) {
            return "(empty)";
        }
        int n = token.length();
        if (n <= 8) {
            return "len=" + n;
        }
        return token.substring(0, 6) + "…len=" + n;
    }
}
