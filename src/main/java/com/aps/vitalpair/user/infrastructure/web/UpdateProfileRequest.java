package com.aps.vitalpair.user.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

public record UpdateProfileRequest(
        @NotNull @Size(min = 1, max = 100) String name,
        @NotNull @Past LocalDate birthDate,
        @NotNull Sex sex,
        @NotNull @DecimalMin("50.0") @DecimalMax("300.0") BigDecimal heightCm,
        @NotNull @DecimalMin("20.0") @DecimalMax("500.0") BigDecimal weightKg,
        @NotNull Goal goal,
        @NotNull ActivityLevel activityLevel,
        /*
         * One person's avatar is rendered in the other's browser, so this string decides where
         * the partner's browser makes a request. With no scheme restriction any address worked as
         * a tracker: whoever picks the avatar receives the partner's IP and user agent every time
         * they open the pair screen. https only, and the regex refuses "javascript:" and "data:"
         * by construction.
         */
        @Size(max = 500) @Pattern(regexp = "^$|^https://[^\\s\"'<>]+$", message = "avatarUrl deve ser uma URL https")
                String avatarUrl) {}
