package com.aps.vitalpair.user.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

/** The profile update. The TDEE fields are required, because the targets are computed from them. */
public record UpdateProfileCommand(
        String name,
        LocalDate birthDate,
        Sex sex,
        BigDecimal heightCm,
        BigDecimal weightKg,
        Goal goal,
        ActivityLevel activityLevel,
        String avatarUrl,
        /** Null leaves the stored zone unchanged. */
        ZoneId timeZone) {}
