package com.aps.vitalpair.notification.infrastructure.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.notification.application.dto.NotificationFeed;
import com.aps.vitalpair.notification.application.dto.NotificationView;
import com.aps.vitalpair.notification.domain.model.NotificationType;

public record NotificationResponse(long unreadCount, List<Item> items) {

    public record Item(
            UUID id,
            NotificationType type,
            String actorName,
            String refText,
            Integer amount,
            boolean read,
            Instant createdAt) {
        static Item from(NotificationView v) {
            return new Item(v.id(), v.type(), v.actorName(), v.refText(), v.amount(), v.read(), v.createdAt());
        }
    }

    public static NotificationResponse from(NotificationFeed feed) {
        return new NotificationResponse(
                feed.unreadCount(), feed.items().stream().map(Item::from).toList());
    }
}
