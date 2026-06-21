package com.aps.vitapair.tdee.domain.model;

import com.aps.vitapair.user.domain.model.ActivityLevel;
import com.aps.vitapair.user.domain.model.Goal;
import com.aps.vitapair.user.domain.model.Sex;
import java.math.BigDecimal;

/** Dados de entrada para o cálculo de TDEE e macros. */
public record TdeeInput(
        Sex sex,
        int age,
        BigDecimal heightCm,
        BigDecimal weightKg,
        ActivityLevel activityLevel,
        Goal goal) {
}
