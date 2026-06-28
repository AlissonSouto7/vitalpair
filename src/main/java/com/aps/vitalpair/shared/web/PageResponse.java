package com.aps.vitalpair.shared.web;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Representação enxuta de uma página, evitando expor a estrutura completa de {@link Page} na API.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last) {

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
