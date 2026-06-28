package com.aps.vitalpair.notification.infrastructure.web;

import com.aps.vitalpair.notification.domain.port.in.GetNotificationPreferencesUseCase;
import com.aps.vitalpair.notification.domain.port.in.UpdateNotificationPreferencesUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/notification-prefs")
public class NotificationPreferencesController {

    private final GetNotificationPreferencesUseCase getPreferencesUseCase;
    private final UpdateNotificationPreferencesUseCase updatePreferencesUseCase;

    public NotificationPreferencesController(
            GetNotificationPreferencesUseCase getPreferencesUseCase,
            UpdateNotificationPreferencesUseCase updatePreferencesUseCase) {
        this.getPreferencesUseCase = getPreferencesUseCase;
        this.updatePreferencesUseCase = updatePreferencesUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPreferencesResponse>> get(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var prefs = getPreferencesUseCase.getPreferences(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(NotificationPreferencesResponse.from(prefs)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<NotificationPreferencesResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateNotificationPreferencesRequest request) {
        var prefs = updatePreferencesUseCase.updatePreferences(
                principal.userId(),
                request.notifyRival(),
                request.notifyFlash(),
                request.notifyReminder());
        return ResponseEntity.ok(
                ApiResponse.ok(NotificationPreferencesResponse.from(prefs), "Preferências atualizadas"));
    }
}
