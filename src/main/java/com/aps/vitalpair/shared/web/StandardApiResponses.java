package com.aps.vitalpair.shared.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

/**
 * The failures every authenticated endpoint can return.
 *
 * <p>Written once and applied per endpoint, because repeating four {@code @ApiResponse}
 * blocks on sixty methods guarantees they drift: the first one to gain a fifth case would
 * be the only one documenting it.
 *
 * <p>Only the shared cases are here. An endpoint with its own failure, a 409 on a workout
 * already completed for instance, documents that itself.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@ApiResponses({
    @ApiResponse(
            responseCode = "400",
            description = "The request body failed validation. `data.violations` names each field.",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
    @ApiResponse(
            responseCode = "401",
            description = "No access token, or one that is expired or invalid.",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
    @ApiResponse(
            responseCode = "422",
            description = "The request is well formed but a business rule refuses it.",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
    @ApiResponse(
            responseCode = "500",
            description = "Unexpected failure. `data.requestId` is the id to quote when reporting it.",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
})
public @interface StandardApiResponses {}
