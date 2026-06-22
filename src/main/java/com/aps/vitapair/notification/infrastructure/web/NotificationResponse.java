package com.aps.vitapair.notification.infrastructure.web;

import com.aps.vitapair.notification.application.dto.NotificationFeed;
import com.aps.vitapair.notification.application.dto.NotificationView;
import com.aps.vitapair.notification.domain.model.NotificationType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record NotificationResponse(long unreadCount, List<Item> items) {

    public record Item(UUID id, NotificationType type, String title, String body, boolean read, Instant createdAt) {
        static Item from(NotificationView v) {
            return new Item(v.id(), v.type(), v.title(), v.body(), v.read(), v.createdAt());
        }
    }

    public static NotificationResponse from(NotificationFeed feed) {
        return new NotificationResponse(feed.unreadCount(), feed.items().stream().map(Item::from).toList());
    }
}
