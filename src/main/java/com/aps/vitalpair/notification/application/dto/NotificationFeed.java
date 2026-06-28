package com.aps.vitalpair.notification.application.dto;

import java.util.List;

public record NotificationFeed(List<NotificationView> items, long unreadCount) {
}
