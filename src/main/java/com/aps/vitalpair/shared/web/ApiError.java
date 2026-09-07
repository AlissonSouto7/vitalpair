package com.aps.vitalpair.shared.web;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The error detail returned in the {@code data} field of an {@link ApiResponse} with
 * {@code success=false}.
 *
 * @param requestId the request identifier, the same one that appears in the server log. It is
 *     what lets someone report a failure and the investigation find the exact line. Absent when
 *     the error happens outside a request.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String path,
        @JsonInclude(JsonInclude.Include.NON_NULL) String requestId,
        List<FieldViolation> violations) {

    /** A violation on one field, in DTO validation errors. */
    public record FieldViolation(String field, String message) {}
}
