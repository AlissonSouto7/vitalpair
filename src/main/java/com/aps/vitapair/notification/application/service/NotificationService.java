package com.aps.vitapair.notification.application.service;

import com.aps.vitapair.notification.application.dto.NotificationFeed;
import com.aps.vitapair.notification.application.dto.NotificationView;
import com.aps.vitapair.notification.domain.model.Notification;
import com.aps.vitapair.notification.domain.model.NotificationType;
import com.aps.vitapair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitapair.notification.domain.port.in.ListNotificationsUseCase;
import com.aps.vitapair.notification.domain.port.in.MarkNotificationsReadUseCase;
import com.aps.vitapair.notification.domain.port.out.NotificationRepositoryPort;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService
        implements ListNotificationsUseCase, MarkNotificationsReadUseCase, CreateNotificationUseCase {

    private static final int RECENT_LIMIT = 30;

    private final NotificationRepositoryPort repository;

    public NotificationService(NotificationRepositoryPort repository) {
        this.repository = repository;
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
    public void create(UUID tenantId, UUID userId, NotificationType type, String title, String body) {
        repository.save(Notification.builder()
                .tenantId(tenantId)
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .read(false)
                .build());
    }

    private NotificationView toView(Notification n) {
        return new NotificationView(n.getId(), n.getType(), n.getTitle(), n.getBody(), n.isRead(), n.getCreatedAt());
    }
}
