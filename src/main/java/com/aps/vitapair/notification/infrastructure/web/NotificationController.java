package com.aps.vitapair.notification.infrastructure.web;

import com.aps.vitapair.notification.domain.port.in.ListNotificationsUseCase;
import com.aps.vitapair.notification.domain.port.in.MarkNotificationsReadUseCase;
import com.aps.vitapair.shared.security.AuthenticatedUser;
import com.aps.vitapair.shared.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final ListNotificationsUseCase listNotificationsUseCase;
    private final MarkNotificationsReadUseCase markNotificationsReadUseCase;

    public NotificationController(
            ListNotificationsUseCase listNotificationsUseCase,
            MarkNotificationsReadUseCase markNotificationsReadUseCase) {
        this.listNotificationsUseCase = listNotificationsUseCase;
        this.markNotificationsReadUseCase = markNotificationsReadUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var feed = listNotificationsUseCase.list(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(NotificationResponse.from(feed)));
    }

    @PutMapping("/read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        markNotificationsReadUseCase.markAllRead(principal.userId());
        return ResponseEntity.ok(ApiResponse.<Void>ok(null, "Notificações marcadas como lidas"));
    }
}
