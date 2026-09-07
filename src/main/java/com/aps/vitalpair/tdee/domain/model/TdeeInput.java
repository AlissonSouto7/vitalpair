package com.aps.vitalpair.tdee.domain.model;

import java.math.BigDecimal;

import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

/** The input of the TDEE and macro calculation. */
public record TdeeInput(
        Sex sex, int age, BigDecimal heightCm, BigDecimal weightKg, ActivityLevel activityLevel, Goal goal) {}
