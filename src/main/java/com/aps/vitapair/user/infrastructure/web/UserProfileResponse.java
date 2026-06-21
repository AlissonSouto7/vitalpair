package com.aps.vitapair.user.infrastructure.web;

import com.aps.vitapair.user.domain.model.ActivityLevel;
import com.aps.vitapair.user.domain.model.Goal;
import com.aps.vitapair.user.domain.model.Sex;
import com.aps.vitapair.user.domain.model.User;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Representação pública do perfil (nunca expõe a entidade de domínio nem o hash de senha). */
public record UserProfileResponse(
        UUID id,
        String email,
        String name,
        LocalDate birthDate,
        Sex sex,
        BigDecimal heightCm,
        BigDecimal weightKg,
        Goal goal,
        ActivityLevel activityLevel,
        Integer dailyCalorieTarget,
        Integer proteinTargetG,
        Integer carbTargetG,
        Integer fatTargetG,
        String avatarUrl,
        Instant createdAt,
        Instant updatedAt) {

    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBirthDate(),
                user.getSex(),
                user.getHeightCm(),
                user.getWeightKg(),
                user.getGoal(),
                user.getActivityLevel(),
                user.getDailyCalorieTarget(),
                user.getProteinTargetG(),
                user.getCarbTargetG(),
                user.getFatTargetG(),
                user.getAvatarUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
