package com.aps.vitapair.notification.application.dto;

import java.util.List;

public record NotificationFeed(List<NotificationView> items, long unreadCount) {
}
