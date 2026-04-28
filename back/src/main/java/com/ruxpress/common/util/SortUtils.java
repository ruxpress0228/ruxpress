package com.ruxpress.common.util;

import org.springframework.data.domain.Sort;

public final class SortUtils {

    private SortUtils() {}

    public static Sort parseCreatedAt(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        String[] tokens = sort.split(",", 2);
        String direction = tokens.length > 1 ? tokens[1].trim() : "desc";
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, "createdAt");
    }
}
