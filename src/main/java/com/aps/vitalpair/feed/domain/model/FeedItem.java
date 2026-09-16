package com.aps.vitalpair.feed.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * An item of the pair's shared timeline. Immutable.
 *
 * <p>The item carries the facts of what was logged, not a sentence about it. The screen writes
 * the sentence, so it comes out in the language the reader chose; a stored sentence could not,
 * because it was already written when the language changed.
 *
 * <p>Which fields are filled depends on {@link #type}: a meal has {@code foodName}, {@code
 * mealType} and the macros, an activity has {@code activityType} and {@code durationMinutes},
 * and both have {@code calories}. Items written before this shape existed have none of them and
 * fall back to {@code title} and {@code subtitle}.
 */
@Getter
@Builder(toBuilder = true)
public class FeedItem {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final String actorName;
    private final FeedItemType type;

    /**
     * The {@code food_logs} or {@code activity_logs} row this came from.
     *
     * <p>How a deletion finds the item to remove. Null only on rows written before the column
     * existed, which is why the deletion path tolerates finding nothing.
     */
    private final UUID sourceId;

    /**
     * The sentence as it used to be stored, in Portuguese.
     *
     * <p>Kept for items written before the structured fields, which would otherwise vanish from
     * the timeline. New items leave both this and {@code subtitle} null.
     */
    private final String title;

    private final String subtitle;

    /** Meal only: what was eaten. */
    private final String foodName;

    /** Meal only: BREAKFAST, LUNCH, DINNER or SNACK, as the enum name. */
    private final String mealType;

    /** Activity only: STEPS, RUN, WALK, CYCLE or WORKOUT, as the enum name. */
    private final String activityType;

    /** Eaten for a meal, burned for an activity. */
    private final Integer calories;

    private final Integer proteinG;
    private final Integer carbG;
    private final Integer fatG;

    /** Activity only, and null when the person did not say how long. */
    private final Integer durationMinutes;

    /**
     * Points this item earned, or zero when it earned none.
     *
     * <p>Not written by the feed: it cannot see what gamification awarded. Zero is what the
     * screen reads as "no badge", and it is the honest default, because the award goes only to
     * the first record of the day. See FeedEventListener for why this is not filled in.
     */
    private final int points;

    private final boolean isPrivate;
    private final Instant createdAt;
}
