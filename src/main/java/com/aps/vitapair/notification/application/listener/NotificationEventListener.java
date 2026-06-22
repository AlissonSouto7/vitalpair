package com.aps.vitapair.notification.application.listener;

import com.aps.vitapair.notification.domain.model.NotificationType;
import com.aps.vitapair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitapair.pair.domain.model.Pair;
import com.aps.vitapair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitapair.shared.event.ActivityLoggedEvent;
import com.aps.vitapair.shared.event.MealLoggedEvent;
import com.aps.vitapair.shared.event.PairFormedEvent;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Gera notificações in-app a partir dos eventos de domínio. Roda APÓS o commit e em transação
 * própria, para que uma falha aqui não desfaça o registro original. Refeições privadas não notificam.
 */
@Component
public class NotificationEventListener {

    private final CreateNotificationUseCase notifications;
    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;

    public NotificationEventListener(
            CreateNotificationUseCase notifications,
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository) {
        this.notifications = notifications;
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMealLogged(MealLoggedEvent event) {
        if (event.isPrivate()) {
            return;
        }
        UUID partner = partnerOf(event.tenantId(), event.userId());
        if (partner == null) {
            return;
        }
        notifications.create(event.tenantId(), partner, NotificationType.PARTNER_MEAL,
                nameOf(event.userId()), event.foodName(), null);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onActivityLogged(ActivityLoggedEvent event) {
        UUID partner = partnerOf(event.tenantId(), event.userId());
        if (partner == null) {
            return;
        }
        notifications.create(event.tenantId(), partner, NotificationType.PARTNER_ACTIVITY,
                nameOf(event.userId()), null, event.caloriesBurned());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPairFormed(PairFormedEvent event) {
        notifications.create(event.tenantId(), event.user1Id(), NotificationType.PAIR_FORMED, null, null, null);
        if (event.user2Id() != null) {
            notifications.create(event.tenantId(), event.user2Id(), NotificationType.PAIR_FORMED, null, null, null);
        }
    }

    private UUID partnerOf(UUID tenantId, UUID actorId) {
        Pair pair = pairRepository.findById(tenantId).orElse(null);
        if (pair == null) {
            return null;
        }
        return actorId.equals(pair.getUser1Id()) ? pair.getUser2Id() : pair.getUser1Id();
    }

    private String nameOf(UUID userId) {
        return userRepository.findById(userId).map(u -> u.getName()).orElse("Seu parceiro");
    }
}
