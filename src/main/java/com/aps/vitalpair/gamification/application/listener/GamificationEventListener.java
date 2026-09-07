package com.aps.vitalpair.gamification.application.listener;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.aps.vitalpair.gamification.application.service.BadgeService;
import com.aps.vitalpair.gamification.application.service.CompetitionService;
import com.aps.vitalpair.gamification.application.service.StreakService;
import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.notification.domain.model.NotificationType;
import com.aps.vitalpair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitalpair.season.domain.model.PointSource;
import com.aps.vitalpair.season.domain.port.in.RecordPointUseCase;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.shared.event.PairFormedEvent;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Updates streaks, the scoreboard and badges from other features' events. Runs AFTER the
 * originating commit and in its own transaction, so a gamification failure never rolls back
 * the log. Points: a meal is 10, an activity 15, and every multiple of 7 streak days 50 more.
 */
@Component
public class GamificationEventListener {

    private static final int MEAL_POINTS = 10;
    private static final int ACTIVITY_POINTS = 15;
    private static final int STREAK_BONUS = 50;
    private static final int STREAK_MILESTONE = 7;

    private final StreakService streakService;
    private final CompetitionService competitionService;
    private final BadgeService badgeService;
    private final RecordPointUseCase pointLedger;
    private final CreateNotificationUseCase notifications;
    private final UserRepositoryPort userRepository;

    public GamificationEventListener(
            StreakService streakService,
            CompetitionService competitionService,
            BadgeService badgeService,
            RecordPointUseCase pointLedger,
            CreateNotificationUseCase notifications,
            UserRepositoryPort userRepository) {
        this.streakService = streakService;
        this.competitionService = competitionService;
        this.badgeService = badgeService;
        this.pointLedger = pointLedger;
        this.notifications = notifications;
        this.userRepository = userRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealLogged(MealLoggedEvent event) {
        award(
                event.userId(),
                event.tenantId(),
                StreakType.NUTRITION_LOG,
                event.date(),
                MEAL_POINTS,
                PointSource.MEAL,
                "FIRST_MEAL",
                "STREAK_7_NUTRITION");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        award(
                event.userId(),
                event.tenantId(),
                StreakType.ACTIVITY,
                event.date(),
                ACTIVITY_POINTS,
                PointSource.ACTIVITY,
                "FIRST_ACTIVITY",
                "STREAK_7_ACTIVITY");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPairFormed(PairFormedEvent event) {
        badgeService.awardByCode(event.user1Id(), event.tenantId(), "PAIR_FORMED");
        if (event.user2Id() != null) {
            badgeService.awardByCode(event.user2Id(), event.tenantId(), "PAIR_FORMED");
        }
    }

    private void award(
            UUID userId,
            UUID tenantId,
            StreakType type,
            LocalDate date,
            int basePoints,
            PointSource baseSource,
            String firstBadgeCode,
            String streakBadgeCode) {
        badgeService.awardByCode(userId, tenantId, firstBadgeCode);
        // Only the first record of the day for this type scores and advances the streak.
        streakService.registerActivity(userId, tenantId, type, date).ifPresent(streak -> {
            UUID partner = competitionService.partnerOf(tenantId, userId);
            // The score before awarding, to detect the overtake transition.
            int actorBefore = competitionService.currentScoreOf(tenantId, userId, date);
            Integer partnerScore = partner == null ? null : competitionService.currentScoreOf(tenantId, partner, date);

            competitionService.addPoints(tenantId, userId, basePoints, date);
            // Espelha o incremento do placar no ledger, no mesmo ponto, para baterem exato.
            pointLedger.record(tenantId, userId, baseSource, basePoints, date);
            if (streak.getCurrentCount() % STREAK_MILESTONE == 0) {
                competitionService.addPoints(tenantId, userId, STREAK_BONUS, date);
                pointLedger.record(tenantId, userId, PointSource.STREAK, STREAK_BONUS, date);
                badgeService.awardByCode(userId, tenantId, streakBadgeCode);
            }

            notifyRivalOvertakeIfNeeded(tenantId, userId, partner, partnerScore, actorBefore, date);
        });
    }

    /**
     * If the points awarded in this call moved the actor from "behind or tied" to "ahead" of the
     * partner, notifies the PARTNER (the one overtaken). Fires on the transition only.
     */
    private void notifyRivalOvertakeIfNeeded(
            UUID tenantId, UUID actorId, UUID partnerId, Integer partnerScore, int actorBefore, LocalDate date) {
        if (partnerId == null || partnerScore == null) {
            return;
        }
        int actorAfter = competitionService.currentScoreOf(tenantId, actorId, date);
        if (actorBefore <= partnerScore && actorAfter > partnerScore) {
            notifications.create(
                    tenantId, partnerId, NotificationType.RIVAL_OVERTOOK, firstNameOf(actorId), null, null);
        }
    }

    private String firstNameOf(UUID userId) {
        return userRepository
                .findById(userId)
                .map(u -> {
                    String name = u.getName();
                    if (name == null || name.isBlank()) {
                        return "Seu parceiro";
                    }
                    return name.trim().split("\\s+")[0];
                })
                .orElse("Seu parceiro");
    }
}
