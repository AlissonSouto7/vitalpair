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
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/** Cria itens da timeline do par a partir dos eventos de nutrição/atividade. */
@Component
public class FeedEventListener {

    private final FeedItemRepositoryPort feedItemRepository;
    private final UserRepositoryPort userRepository;

    public FeedEventListener(FeedItemRepositoryPort feedItemRepository, UserRepositoryPort userRepository) {
        this.feedItemRepository = feedItemRepository;
        this.userRepository = userRepository;
    }

    private static final int MEAL_POINTS = 10;
    private static final int ACTIVITY_POINTS = 15;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealLogged(MealLoggedEvent event) {
        String title = event.foodName() + " (" + mealTypeLabel(event.mealType()) + ")";
        String subtitle = String.format(
                "%d kcal · P %dg · C %dg · G %dg", event.caloriesKcal(), event.proteinG(), event.carbG(), event.fatG());
        save(
                event.userId(),
                event.tenantId(),
                FeedItemType.MEAL_LOGGED,
                title,
                subtitle,
                MEAL_POINTS,
                event.isPrivate());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        String title = activityTypeLabel(event.activityType()) + " — " + event.caloriesBurned() + " kcal";
        String subtitle = event.durationMinutes() != null
                ? event.durationMinutes() + " min · " + event.caloriesBurned() + " kcal"
                : event.caloriesBurned() + " kcal";
        save(event.userId(), event.tenantId(), FeedItemType.ACTIVITY_LOGGED, title, subtitle, ACTIVITY_POINTS, false);
    }

    private void save(
            UUID userId,
            UUID tenantId,
            FeedItemType type,
            String title,
            String subtitle,
            int points,
            boolean isPrivate) {
        String actorName = userRepository.findById(userId).map(u -> u.getName()).orElse("Alguém");
        feedItemRepository.save(FeedItem.builder()
                .tenantId(tenantId)
                .userId(userId)
                .actorName(actorName)
                .type(type)
                .title(title)
                .subtitle(subtitle)
                .points(points)
                .isPrivate(isPrivate)
                .build());
    }

    private String mealTypeLabel(String mealType) {
        return switch (mealType) {
            case "BREAKFAST" -> "Café da manhã";
            case "LUNCH" -> "Almoço";
            case "DINNER" -> "Jantar";
            case "SNACK" -> "Lanche";
            default -> mealType;
        };
    }

    private String activityTypeLabel(String activityType) {
        return switch (activityType) {
            case "STEPS" -> "Passos";
            case "RUN" -> "Corrida";
            case "WALK" -> "Caminhada";
            case "CYCLE" -> "Pedalada";
            case "WORKOUT" -> "Treino";
            default -> "Atividade";
        };
    }
}
