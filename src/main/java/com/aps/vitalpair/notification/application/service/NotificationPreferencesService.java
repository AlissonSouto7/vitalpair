package com.aps.vitalpair.notification.application.service;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;
import com.aps.vitalpair.notification.domain.port.in.GetNotificationPreferencesUseCase;
import com.aps.vitalpair.notification.domain.port.in.UpdateNotificationPreferencesUseCase;
import com.aps.vitalpair.notification.domain.port.out.NotificationPreferencesRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationPreferencesService
        implements GetNotificationPreferencesUseCase, UpdateNotificationPreferencesUseCase {

    private final NotificationPreferencesRepositoryPort repository;

    public NotificationPreferencesService(NotificationPreferencesRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferences getPreferences(UUID userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> NotificationPreferences.defaultsFor(userId));
    }

    @Override
    @Transactional
    public NotificationPreferences updatePreferences(
            UUID userId, boolean notifyRival, boolean notifyFlash, boolean notifyReminder) {
        return repository.save(NotificationPreferences.builder()
                .userId(userId)
                .notifyRival(notifyRival)
                .notifyFlash(notifyFlash)
                .notifyReminder(notifyReminder)
                .build());
    }
}
