package com.aps.vitalpair.notification.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;
import com.aps.vitalpair.notification.domain.port.out.NotificationPreferencesRepositoryPort;

@Component
public class NotificationPreferencesPersistenceAdapter implements NotificationPreferencesRepositoryPort {

    private final NotificationPreferencesJpaRepository repository;

    public NotificationPreferencesPersistenceAdapter(NotificationPreferencesJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<NotificationPreferences> findByUserId(UUID userId) {
        return repository.findById(userId).map(this::toDomain);
    }

    @Override
    public NotificationPreferences save(NotificationPreferences preferences) {
        return toDomain(repository.save(toEntity(preferences)));
    }

    private NotificationPreferences toDomain(NotificationPreferencesJpaEntity entity) {
        return NotificationPreferences.builder()
                .userId(entity.getUserId())
                .notifyRival(entity.isNotifyRival())
                .notifyFlash(entity.isNotifyFlash())
                .notifyReminder(entity.isNotifyReminder())
                .build();
    }

    private NotificationPreferencesJpaEntity toEntity(NotificationPreferences prefs) {
        return NotificationPreferencesJpaEntity.builder()
                .userId(prefs.getUserId())
                .notifyRival(prefs.isNotifyRival())
                .notifyFlash(prefs.isNotifyFlash())
                .notifyReminder(prefs.isNotifyReminder())
                .build();
    }
}
