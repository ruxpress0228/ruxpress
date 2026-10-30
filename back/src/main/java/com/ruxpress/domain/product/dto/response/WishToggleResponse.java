package com.ruxpress.domain.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 찜 추가/해제 결과: {@code { productId, wished, count }}. */
@Getter
@AllArgsConstructor
public class WishToggleResponse {

    private final Long productId;
    /** 호출 후 찜 여부. Lombok 의 {@code isWished()} 를 Jackson 이 {@code wished} 로 직렬화한다 (ProductJsonShapeTest 에서 검증). */
    private final boolean wished;
    /** 호출 후 회원 찜 목록 크기 */
    private final long count;
}
