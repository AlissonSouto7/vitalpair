package com.aps.vitalpair.user.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.shared.security.Role;

import lombok.Builder;
import lombok.Getter;

/**
 * Domain model of the user. Immutable: changes produce a new instance through
 * {@link #toBuilder()}. Not a JPA entity (see {@code infrastructure.persistence.UserJpaEntity}).
 */
@Getter
@Builder(toBuilder = true)
public class User {

    private final UUID id;
    private final UUID tenantId;
    private final String email;
    private final String passwordHash;
    private final boolean emailVerified;
    private final Role role;
    private final String name;
    private final LocalDate birthDate;
    private final Sex sex;
    private final BigDecimal heightCm;
    private final BigDecimal weightKg;
    private final Goal goal;
    private final ActivityLevel activityLevel;
    private final Integer dailyCalorieTarget;
    private final Integer proteinTargetG;
    private final Integer carbTargetG;
    private final Integer fatTargetG;
    private final String avatarUrl;
    private final Instant createdAt;
    private final Instant updatedAt;
}
