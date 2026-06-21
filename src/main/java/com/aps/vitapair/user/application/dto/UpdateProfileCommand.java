package com.aps.vitapair.user.application.dto;

import com.aps.vitapair.user.domain.model.ActivityLevel;
import com.aps.vitapair.user.domain.model.Goal;
import com.aps.vitapair.user.domain.model.Sex;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Dados de atualização do perfil. Os campos de TDEE são obrigatórios para o cálculo das metas. */
public record UpdateProfileCommand(
        String name,
        LocalDate birthDate,
        Sex sex,
        BigDecimal heightCm,
        BigDecimal weightKg,
        Goal goal,
        ActivityLevel activityLevel,
        String avatarUrl) {
}
