package com.aps.vitalpair.auth.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min = 8, max = 100) String newPassword) {}
