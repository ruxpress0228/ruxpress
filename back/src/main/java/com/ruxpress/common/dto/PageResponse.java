package com.ruxpress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class PageResponse<T> {

    private final List<T> content;
    private final long totalElements;
    private final int totalPages;
    private final int page;
    private final int size;
}
