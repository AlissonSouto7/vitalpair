package com.aps.vitapair.gamification.application.listener;

import com.aps.vitapair.gamification.application.service.CompetitionService;
import com.aps.vitapair.gamification.application.service.StreakService;
import com.aps.vitapair.gamification.domain.model.StreakType;
import com.aps.vitapair.shared.event.ActivityLoggedEvent;
import com.aps.vitapair.shared.event.MealLoggedEvent;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Atualiza streaks e o placar a partir dos eventos de nutrição/atividade. Roda APÓS o commit do
 * registro original e em transação própria, para que uma falha de gamificação não desfaça o log.
 * Pontos (§5.6): refeição +10, atividade +15, e +50 ao completar múltiplos de 7 dias de streak.
 */
@Component
public class GamificationEventListener {

    private static final int MEAL_POINTS = 10;
    private static final int ACTIVITY_POINTS = 15;
    private static final int STREAK_BONUS = 50;
    private static final int STREAK_MILESTONE = 7;

    private final StreakService streakService;
    private final CompetitionService competitionService;

    public GamificationEventListener(StreakService streakService, CompetitionService competitionService) {
        this.streakService = streakService;
        this.competitionService = competitionService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealLogged(MealLoggedEvent event) {
        award(event.userId(), event.tenantId(), StreakType.NUTRITION_LOG, event.date(), MEAL_POINTS);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        award(event.userId(), event.tenantId(), StreakType.ACTIVITY, event.date(), ACTIVITY_POINTS);
    }

    private void award(UUID userId, UUID tenantId, StreakType type, LocalDate date, int basePoints) {
        // Só pontua/avança no primeiro registro do dia para o tipo.
        streakService.registerActivity(userId, tenantId, type, date).ifPresent(streak -> {
            competitionService.addPoints(tenantId, userId, basePoints, date);
            if (streak.getCurrentCount() % STREAK_MILESTONE == 0) {
                competitionService.addPoints(tenantId, userId, STREAK_BONUS, date);
            }
        });
    }
}
