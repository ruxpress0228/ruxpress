package com.ruxpress.common.util;

/**
 * 도메인(모듈)별 파일 업로드 경로 prefix 상수.
 * 서비스 레이어에서 문자열 오타로 경로가 달라지는 실수를 방지한다.
 */
public final class ModulePrefix {

    private ModulePrefix() {
    }

    public static final String PURCHASE = "purchase";
    public static final String INQUIRY = "inquiry";
}

