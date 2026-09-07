package com.aps.vitalpair.pair.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.pair.domain.port.out.TenantDataMigrationPort;

/**
 * Reassigns a user's rows to their new tenant when they join a pair.
 *
 * <p>Written as plain SQL on purpose. The alternative is loading every row of eight tables
 * through their JPA entities to change one column, which means eight repositories this
 * feature would otherwise never depend on, and a read of data the operation does not care
 * about. The statements are parameterised and the table names are constants in this file,
 * so nothing here is built from input.
 *
 * <p>The tables are listed explicitly rather than discovered from the catalogue. A new table
 * carrying tenant_id and user_id must be added here, and {@code PairFormationIT} is what
 * fails when it is not: the abandoned pair cannot be deleted while any row still points at
 * it, so the omission surfaces as a failed join rather than as silently stranded data.
 */
@Component
public class TenantDataMigrationAdapter implements TenantDataMigrationPort {

    private static final Logger log = LoggerFactory.getLogger(TenantDataMigrationAdapter.class);

    /**
     * Every table holding rows that belong to one person inside a tenant.
     *
     * <p>Verified against the database catalogue on 2026-09-06: twelve tables carry
     * tenant_id besides users, and these nine are the ones that also carry user_id. The
     * other three are handled by {@link #discardTenantOwnedData(UUID)}.
     */
    private static final List<String> USER_OWNED_TABLES = List.of(
            "food_logs",
            "activity_logs",
            "feed_items",
            "notifications",
            "point_events",
            "user_badges",
            "user_streaks",
            "meal_plans",
            "workout_plans");

    /**
     * Tables describing the pair itself rather than one of its members.
     *
     * <p>Ordered so that nothing referenced by another row is deleted first. None of the
     * three references the others today, but the order costs nothing and is what stops a
     * later addition from failing intermittently depending on list order.
     */
    private static final List<String> TENANT_OWNED_TABLES = List.of("competition_scores", "pair_missions", "seasons");

    private final JdbcTemplate jdbc;

    public TenantDataMigrationAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public int moveUserData(UUID userId, UUID fromTenantId, UUID toTenantId) {
        int moved = 0;
        for (String table : USER_OWNED_TABLES) {
            moved += jdbc.update(
                    "UPDATE " + table + " SET tenant_id = ? WHERE user_id = ? AND tenant_id = ?",
                    toTenantId,
                    userId,
                    fromTenantId);
        }
        if (moved > 0) {
            log.info("Moved {} rows of user {} from tenant {} to {}", moved, userId, fromTenantId, toTenantId);
        }
        return moved;
    }

    @Override
    public int discardTenantOwnedData(UUID tenantId) {
        int discarded = 0;
        for (String table : TENANT_OWNED_TABLES) {
            discarded += jdbc.update("DELETE FROM " + table + " WHERE tenant_id = ?", tenantId);
        }
        if (discarded > 0) {
            log.info("Discarded {} rows belonging to abandoned tenant {}", discarded, tenantId);
        }
        return discarded;
    }
}
