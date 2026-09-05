package com.aps.vitalpair.user.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
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
        @Size(max = 500) String avatarUrl) {}
