package com.aps.vitalpair.user.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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

    /**
     * The zone the user's day is measured in, as an IANA identifier.
     *
     * <p>Everything the product calls "today" is a question about this user's day, not the
     * server's: the meals on the day's list, the totals on the dashboard, the streak. The
     * server's own zone is an accident of where it runs, so it can never answer that. An
     * identifier rather than an offset, because an offset does not know about daylight
     * saving and Brazil has had it before.
     */
    private final ZoneId timeZone;

    private final Instant createdAt;
    private final Instant updatedAt;

    /**
     * The zone to measure this user's day in, never null.
     *
     * <p>The column is NOT NULL, so this only fills in for a User built in memory without one:
     * a mapper test, or a caller assembling one field at a time. Everything that asks about a
     * day goes through here, so a missing zone degrades to the default instead of throwing on
     * a screen that has nothing to do with the preference.
     */
    public ZoneId zone() {
        return timeZone != null ? timeZone : UserTimeZones.FALLBACK;
    }

    /**
     * When the account was closed, or null while it is live.
     *
     * <p>The row survives closure as a tombstone, so something has to say so. The JWT filter
     * validates a signature and never reads the database, which is why the session refresh
     * checks this column: without it, a token issued before the closure would keep renewing.
     */
    private final Instant deletedAt;
}
