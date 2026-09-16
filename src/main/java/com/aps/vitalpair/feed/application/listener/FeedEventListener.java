package com.aps.vitalpair.feed.application.listener;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedItemType;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.shared.event.ActivityDeletedEvent;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealDeletedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Keeps the pair's timeline in step with what the two of them log.
 *
 * <p>The item stores the type and the numbers, not a finished sentence. It used to store the
 * sentence, built here in Portuguese, so the timeline stayed in Portuguese with the interface in
 * English and changing language changed nothing: the words had already been persisted. The
 * screen composes the text now, through {@code t()}, from the fields below.
 *
 * <p>It also stores the id of the record it came from, which is what makes a deletion reach the
 * timeline. Without it, deleting a meal emptied the diary and left the item in place, so the
 * partner went on reading a meal that no longer existed.
 *
 * <p>No points are written here. Points are awarded by gamification, which grants them only for
 * the first record of the day of each type, and this listener cannot see that decision: both
 * listeners run on the same event, after the same commit, in no defined order. It used to stamp
 * a constant 10 or 15 on every item regardless, so the badge claimed points that were never
 * granted. Measured on the local database before the fix: the timeline advertised 625 points
 * against 305 in the ledger. What the reader can be told truthfully is what was logged, so that
 * is all this writes.
 */
@Component
public class FeedEventListener {

    private final FeedItemRepositoryPort feedItemRepository;
    private final UserRepositoryPort userRepository;

    public FeedEventListener(FeedItemRepositoryPort feedItemRepository, UserRepositoryPort userRepository) {
        this.feedItemRepository = feedItemRepository;
        this.userRepository = userRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealLogged(MealLoggedEvent event) {
        feedItemRepository.save(FeedItem.builder()
                .tenantId(event.tenantId())
                .userId(event.userId())
                .actorName(actorName(event.userId()))
                .type(FeedItemType.MEAL_LOGGED)
                .sourceId(event.foodLogId())
                .foodName(event.foodName())
                .mealType(event.mealType())
                .calories(event.caloriesKcal())
                .proteinG(event.proteinG())
                .carbG(event.carbG())
                .fatG(event.fatG())
                .isPrivate(event.isPrivate())
                .build());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        feedItemRepository.save(FeedItem.builder()
                .tenantId(event.tenantId())
                .userId(event.userId())
                .actorName(actorName(event.userId()))
                .type(FeedItemType.ACTIVITY_LOGGED)
                .sourceId(event.activityLogId())
                .activityType(event.activityType())
                .calories(event.caloriesBurned())
                .durationMinutes(event.durationMinutes())
                // An activity is never private: there is no such flag on the record.
                .isPrivate(false)
                .build());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealDeleted(MealDeletedEvent event) {
        feedItemRepository.deleteBySource(event.tenantId(), event.foodLogId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityDeleted(ActivityDeletedEvent event) {
        feedItemRepository.deleteBySource(event.tenantId(), event.activityLogId());
    }

    /**
     * The name shown on the item, copied in at write time.
     *
     * <p>Denormalised on purpose: the timeline reads in bulk and the name it showed then is the
     * name that belongs to that moment. A missing profile is not a reason to lose the item.
     */
    private String actorName(UUID userId) {
        return userRepository.findById(userId).map(u -> u.getName()).orElse("Alguém");
    }
}
