package com.aps.vitalpair.gamification.application.listener;

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
        award(event.userId(), event.tenantId(), StreakType.NUTRITION_LOG, event.date(),
                MEAL_POINTS, PointSource.MEAL, "FIRST_MEAL", "STREAK_7_NUTRITION");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        award(event.userId(), event.tenantId(), StreakType.ACTIVITY, event.date(),
                ACTIVITY_POINTS, PointSource.ACTIVITY, "FIRST_ACTIVITY", "STREAK_7_ACTIVITY");
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
                       int basePoints, PointSource baseSource, String firstBadgeCode, String streakBadgeCode) {
        badgeService.awardByCode(userId, tenantId, firstBadgeCode);
        // Só pontua/avança a streak no primeiro registro do dia para o tipo.
        streakService.registerActivity(userId, tenantId, type, date).ifPresent(streak -> {
            UUID partner = competitionService.partnerOf(tenantId, userId);
            // Placar antes de pontuar, para detectar a transição de ultrapassagem.
            int actorBefore = competitionService.currentScoreOf(tenantId, userId, date);
            Integer partnerScore = partner == null ? null
                    : competitionService.currentScoreOf(tenantId, partner, date);

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
     * Se, com os pontos somados nesta chamada, o ator passou de "atrás ou empatado" para "à frente"
     * do parceiro, notifica o PARCEIRO (quem foi ultrapassado). Só dispara na transição.
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
        return userRepository.findById(userId)
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
