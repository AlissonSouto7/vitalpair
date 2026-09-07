package com.aps.vitalpair.shared.web;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * A lean representation of a page, so the full structure of {@link Page} is not exposed in the
 * API.
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }
}
