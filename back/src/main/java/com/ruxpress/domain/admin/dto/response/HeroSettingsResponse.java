package com.ruxpress.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 랜딩 히어로 이미지 응답: {@code { imageUrl }}.
 * {@code imageUrl} 은 {@code FileStoragePort.getViewUrl} 로 만든 브라우저용 URL. 설정이 없거나 값이 비어 있으면 null
 * (키 자체는 항상 내려간다 — HeroSettingsJsonShapeTest 에서 검증).
 */
@Getter
@AllArgsConstructor
public class HeroSettingsResponse {

    private final String imageUrl;
}
