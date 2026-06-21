package com.aps.vitapair.auth.infrastructure.web;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String email,
        @NotBlank String password) {
}
