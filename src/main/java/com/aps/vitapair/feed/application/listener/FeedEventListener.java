package com.aps.vitapair.feed.application.listener;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.model.FeedItemType;
import com.aps.vitapair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitapair.shared.event.ActivityLoggedEvent;
import com.aps.vitapair.shared.event.MealLoggedEvent;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Cria itens da timeline do par a partir dos eventos de nutrição/atividade. */
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
        String title = event.foodName() + " (" + mealTypeLabel(event.mealType()) + ")";
        save(event.userId(), event.tenantId(), FeedItemType.MEAL_LOGGED, title);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        String title = activityTypeLabel(event.activityType()) + " — " + event.caloriesBurned() + " kcal";
        save(event.userId(), event.tenantId(), FeedItemType.ACTIVITY_LOGGED, title);
    }

    private void save(UUID userId, UUID tenantId, FeedItemType type, String title) {
        String actorName = userRepository.findById(userId).map(u -> u.getName()).orElse("Alguém");
        feedItemRepository.save(FeedItem.builder()
                .tenantId(tenantId)
                .userId(userId)
                .actorName(actorName)
                .type(type)
                .title(title)
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
