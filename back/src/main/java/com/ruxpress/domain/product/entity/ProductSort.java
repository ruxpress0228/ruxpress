package com.ruxpress.domain.product.entity;

import org.springframework.data.domain.Sort;

import java.util.Locale;

/**
 * 공개 상품 목록 정렬 기준. 쿼리 파라미터 {@code sort} 는 대소문자를 무시하며, 비어 있거나 알 수 없는 값은 {@link #RECOMMENDED} 로 본다.
 * 정렬은 {@code ProductRepository.findActive} 의 Pageable 에 실어 Spring Data 가 JPQL 에 ORDER BY 를 붙이게 한다.
 */
public enum ProductSort {

    /** 추천 우선: isFeatured desc, sortOrder asc, createdAt desc */
    RECOMMENDED(Sort.by(Sort.Order.desc("isFeatured"), Sort.Order.asc("sortOrder"), Sort.Order.desc("createdAt"))),
    /** 최신순: createdAt desc, id desc */
    LATEST(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))),
    /** 인기순: viewCount desc, createdAt desc */
    POPULAR(Sort.by(Sort.Order.desc("viewCount"), Sort.Order.desc("createdAt"))),
    /** 낮은 가격순: priceKrw asc, id asc */
    PRICE_ASC(Sort.by(Sort.Order.asc("priceKrw"), Sort.Order.asc("id"))),
    /** 높은 가격순: priceKrw desc, id desc */
    PRICE_DESC(Sort.by(Sort.Order.desc("priceKrw"), Sort.Order.desc("id")));

    private final Sort sort;

    ProductSort(Sort sort) {
        this.sort = sort;
    }

    public Sort toSort() {
        return sort;
    }

    /**
     * {@code recommended} / {@code latest} / {@code popular} / {@code priceAsc} / {@code priceDesc}
     * (대소문자·밑줄 무시, 앞뒤 공백 제거). 그 외·null·공백은 {@link #RECOMMENDED}.
     */
    public static ProductSort from(String value) {
        if (value == null || value.isBlank()) {
            return RECOMMENDED;
        }
        String key = value.trim().replace("_", "").toUpperCase(Locale.ROOT);
        for (ProductSort candidate : values()) {
            if (candidate.name().replace("_", "").equals(key)) {
                return candidate;
            }
        }
        return RECOMMENDED;
    }
}
