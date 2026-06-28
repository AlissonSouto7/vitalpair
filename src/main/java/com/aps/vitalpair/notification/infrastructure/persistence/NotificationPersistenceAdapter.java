package com.aps.vitalpair.notification.infrastructure.persistence;

import com.aps.vitalpair.notification.domain.model.Notification;
import com.aps.vitalpair.notification.domain.port.out.NotificationRepositoryPort;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
public class NotificationPersistenceAdapter implements NotificationRepositoryPort {

    private final NotificationJpaRepository repository;
    private final NotificationPersistenceMapper mapper;

    public NotificationPersistenceAdapter(NotificationJpaRepository repository, NotificationPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Notification save(Notification notification) {
        return mapper.toDomain(repository.save(mapper.toEntity(notification)));
    }

    @Override
    public List<Notification> findRecentByUser(UUID userId, int limit) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, limit)).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public long countUnread(UUID userId) {
        return repository.countByUserIdAndReadIsFalse(userId);
    }

    @Override
    public void markAllRead(UUID userId) {
        repository.markAllRead(userId);
    }
}
