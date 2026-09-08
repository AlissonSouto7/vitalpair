package com.aps.vitalpair.user.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.user.domain.port.out.PersonalDataErasurePort;

/**
 * Deletes a closed account's own records with plain SQL.
 *
 * <p>Written as SQL for the same reason {@code TenantDataMigrationAdapter} is: the
 * alternative is loading every row of nine tables through their JPA entities in order to
 * delete them, which means nine repositories this feature would otherwise never depend on.
 * The statements are parameterised and the table names are constants in this file, so
 * nothing here is built from input.
 *
 * <p>The tables are listed explicitly rather than discovered from the catalogue, and the
 * list is deliberately shorter than "everything with a user_id". What is missing from it is
 * the point of the feature: see {@link PersonalDataErasurePort}.
 */
@Component
public class PersonalDataErasureAdapter implements PersonalDataErasurePort {

    private static final Logger log = LoggerFactory.getLogger(PersonalDataErasureAdapter.class);

    /**
     * Tables holding what one person recorded about themselves, deleted outright.
     *
     * <p>Ordered so nothing referenced by another row goes first. {@code feed_reactions}
     * precedes {@code feed_items} because a reaction points at an item: without this, the
     * cascade on that foreign key would take the partner's reactions to this person's posts
     * along with them. Deleting the departing person's own reactions first keeps that
     * cascade to what it is meant to remove.
     *
     * <p>Verified against the migrations on 2026-09-08. {@code weight_logs} and
     * {@code notification_preferences} carry {@code user_id} and no {@code tenant_id}, which
     * is why they are absent from the tenant migration list and present here.
     */
    private static final List<String> PERSONAL_TABLES = List.of(
            "feed_reactions",
            "feed_items",
            "food_logs",
            "activity_logs",
            "weight_logs",
            "notification_preferences",
            "notifications",
            "meal_plans",
            "workout_plans");

    private final JdbcTemplate jdbc;

    public PersonalDataErasureAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public int erasePersonalRecords(UUID userId) {
        int deleted = 0;
        for (String table : PERSONAL_TABLES) {
            deleted += jdbc.update("DELETE FROM " + table + " WHERE user_id = ?", userId);
        }

        // The scoreboard names a winner. The row belongs to the pair and holds both members'
        // scores in one tuple, so it cannot be deleted without taking the partner's week
        // with it; only the name of the winner is removed.
        jdbc.update("UPDATE competition_scores SET winner_id = NULL WHERE winner_id = ?", userId);
        jdbc.update("UPDATE seasons SET winner_user_id = NULL WHERE winner_user_id = ?", userId);

        log.info("Erased {} personal rows for closed account {}", deleted, userId);
        return deleted;
    }
}
