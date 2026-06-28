package com.aps.vitalpair.notification.application.service;

import com.aps.vitalpair.notification.application.dto.NotificationFeed;
import com.aps.vitalpair.notification.application.dto.NotificationView;
import com.aps.vitalpair.notification.domain.model.Notification;
import com.aps.vitalpair.notification.domain.model.NotificationPreferences;
import com.aps.vitalpair.notification.domain.model.NotificationType;
import com.aps.vitalpair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitalpair.notification.domain.port.in.ListNotificationsUseCase;
import com.aps.vitalpair.notification.domain.port.in.MarkNotificationsReadUseCase;
import com.aps.vitalpair.notification.domain.port.out.NotificationPreferencesRepositoryPort;
import com.aps.vitalpair.notification.domain.port.out.NotificationRepositoryPort;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService
        implements ListNotificationsUseCase, MarkNotificationsReadUseCase, CreateNotificationUseCase {

    private static final int RECENT_LIMIT = 30;

    private final NotificationRepositoryPort repository;
    private final NotificationPreferencesRepositoryPort preferencesRepository;

    public NotificationService(
            NotificationRepositoryPort repository,
            NotificationPreferencesRepositoryPort preferencesRepository) {
        this.repository = repository;
        this.preferencesRepository = preferencesRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationFeed list(UUID userId) {
        List<NotificationView> items = repository.findRecentByUser(userId, RECENT_LIMIT).stream()
                .map(this::toView)
                .toList();
        return new NotificationFeed(items, repository.countUnread(userId));
    }

    @Override
    @Transactional
    public void markAllRead(UUID userId) {
        repository.markAllRead(userId);
    }

    @Override
    @Transactional
    public void create(UUID tenantId, UUID userId, NotificationType type, String actorName, String refText, Integer amount) {
        if (suppressedByPreference(userId, type)) {
            return;
        }
        repository.save(Notification.builder()
                .tenantId(tenantId)
                .userId(userId)
                .type(type)
                .actorName(actorName)
                .refText(refText)
                .amount(amount)
                .read(false)
                .build());
    }

    /**
     * Tipos disparados por gatilhos automáticos (rival, missão relâmpago, lembrete) respeitam a
     * preferência do destinatário. Os tipos antigos (refeição/atividade/par) são sempre criados.
     */
    private boolean suppressedByPreference(UUID userId, NotificationType type) {
        if (type != NotificationType.RIVAL_OVERTOOK
                && type != NotificationType.FLASH_MISSION
                && type != NotificationType.LOG_REMINDER) {
            return false;
        }
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> NotificationPreferences.defaultsFor(userId));
        return switch (type) {
            case RIVAL_OVERTOOK -> !prefs.isNotifyRival();
            case FLASH_MISSION -> !prefs.isNotifyFlash();
            case LOG_REMINDER -> !prefs.isNotifyReminder();
            default -> false;
        };
    }

    private NotificationView toView(Notification n) {
        return new NotificationView(
                n.getId(), n.getType(), n.getActorName(), n.getRefText(), n.getAmount(), n.isRead(), n.getCreatedAt());
    }
}
