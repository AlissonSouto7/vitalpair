package com.aps.vitapair.auth.infrastructure.web;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
        @NotBlank String idToken) {
}
