package com.aps.vitalpair.feed.infrastructure.web;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedItemType;
import com.aps.vitalpair.feed.domain.model.ReactionType;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * One timeline item as the client reads it.
 *
 * <p>The item describes what was logged and the client writes the sentence, so the timeline is
 * in the language the reader picked. It used to ship a finished Portuguese sentence, which the
 * screen printed as-is: with the interface in English the timeline stayed in Portuguese, and
 * changing language changed nothing because the words were already in the database.
 *
 * @param title the old pre-rendered sentence, present only on items written before that change.
 *     A client that finds it null composes the text from the fields below.
 */
public record FeedItemResponse(
        UUID id,
        UUID userId,
        String actorName,
        FeedItemType type,
        @Schema(description = "Pre-rendered text, legacy items only. Null on current items.") String title,
        @Schema(description = "Pre-rendered detail line, legacy items only.") String subtitle,
        @Schema(description = "Meal only: what was eaten.") String foodName,
        @Schema(description = "Meal only: BREAKFAST, LUNCH, DINNER or SNACK.") String mealType,
        @Schema(description = "Activity only: STEPS, RUN, WALK, CYCLE or WORKOUT.") String activityType,
        @Schema(description = "Eaten for a meal, burned for an activity.") Integer calories,
        Integer proteinG,
        Integer carbG,
        Integer fatG,
        @Schema(description = "Activity only, null when not given.") Integer durationMinutes,
        @Schema(description = "Points actually awarded, which is zero for all but the day's first record of a type.")
                int points,
        boolean isPrivate,
        Instant createdAt,
        Map<ReactionType, Long> reactionCounts,
        Set<ReactionType> myReactions) {

    public static FeedItemResponse from(FeedItemView view) {
        FeedItem item = view.item();
        return new FeedItemResponse(
                item.getId(),
                item.getUserId(),
                item.getActorName(),
                item.getType(),
                item.getTitle(),
                item.getSubtitle(),
                item.getFoodName(),
                item.getMealType(),
                item.getActivityType(),
                item.getCalories(),
                item.getProteinG(),
                item.getCarbG(),
                item.getFatG(),
                item.getDurationMinutes(),
                item.getPoints(),
                item.isPrivate(),
                item.getCreatedAt(),
                view.reactionCounts(),
                view.myReactions());
    }
}
