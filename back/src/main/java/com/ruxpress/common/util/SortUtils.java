package com.ruxpress.common.util;

import org.springframework.data.domain.Sort;

public final class SortUtils {

    private SortUtils() {}

    public static Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] tokens = sort.split(",", 2);
        String property = tokens[0].trim();
        if (property.isEmpty()) {
            property = "createdAt";
        }
        String directionStr = tokens.length > 1 ? tokens[1].trim() : "desc";
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(directionStr)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, resolveSortProperty(property));
    }

    public static Sort parseCreatedAt(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        String[] tokens = sort.split(",", 2);
        String direction = tokens.length > 1 ? tokens[1].trim() : "desc";
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, "createdAt");
    }

    private static String resolveSortProperty(String property) {
        return switch (property) {
            case "updatedAt" -> "updatedAt";
            case "id" -> "id";
            default -> "createdAt";
        };
    }
}
