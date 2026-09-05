package com.aps.vitalpair.notification.infrastructure.web;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferencesRequest(
        @NotNull Boolean notifyRival, @NotNull Boolean notifyFlash, @NotNull Boolean notifyReminder) {}
