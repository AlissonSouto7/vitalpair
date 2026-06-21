package com.aps.vitapair.gamification.application.listener;

import com.aps.vitapair.gamification.application.service.BadgeService;
import com.aps.vitapair.gamification.application.service.CompetitionService;
import com.aps.vitapair.gamification.application.service.StreakService;
import com.aps.vitapair.gamification.domain.model.StreakType;
import com.aps.vitapair.shared.event.ActivityLoggedEvent;
import com.aps.vitapair.shared.event.MealLoggedEvent;
import com.aps.vitapair.shared.event.PairFormedEvent;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Atualiza streaks, placar e conquistas a partir dos eventos de outras features. Roda APÓS o commit
 * do registro original e em transação própria, para que falhas de gamificação não desfaçam o log.
 * Pontos (§5.6): refeição +10, atividade +15, +50 ao completar múltiplos de 7 dias de streak.
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

    public GamificationEventListener(
            StreakService streakService, CompetitionService competitionService, BadgeService badgeService) {
        this.streakService = streakService;
        this.competitionService = competitionService;
        this.badgeService = badgeService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealLogged(MealLoggedEvent event) {
        award(event.userId(), event.tenantId(), StreakType.NUTRITION_LOG, event.date(),
                MEAL_POINTS, "FIRST_MEAL", "STREAK_7_NUTRITION");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        award(event.userId(), event.tenantId(), StreakType.ACTIVITY, event.date(),
                ACTIVITY_POINTS, "FIRST_ACTIVITY", "STREAK_7_ACTIVITY");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPairFormed(PairFormedEvent event) {
        badgeService.awardByCode(event.user1Id(), event.tenantId(), "PAIR_FORMED");
        if (event.user2Id() != null) {
            badgeService.awardByCode(event.user2Id(), event.tenantId(), "PAIR_FORMED");
        }
    }

    private void award(UUID userId, UUID tenantId, StreakType type, LocalDate date,
                       int basePoints, String firstBadgeCode, String streakBadgeCode) {
        badgeService.awardByCode(userId, tenantId, firstBadgeCode);
        // Só pontua/avança a streak no primeiro registro do dia para o tipo.
        streakService.registerActivity(userId, tenantId, type, date).ifPresent(streak -> {
            competitionService.addPoints(tenantId, userId, basePoints, date);
            if (streak.getCurrentCount() % STREAK_MILESTONE == 0) {
                competitionService.addPoints(tenantId, userId, STREAK_BONUS, date);
                badgeService.awardByCode(userId, tenantId, streakBadgeCode);
            }
        });
    }
}
