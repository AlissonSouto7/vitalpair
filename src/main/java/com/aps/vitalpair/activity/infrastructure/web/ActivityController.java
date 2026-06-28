package com.aps.vitalpair.activity.infrastructure.web;

import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.port.in.GetActivitySummaryUseCase;
import com.aps.vitalpair.activity.domain.port.in.GetDailyActivitiesUseCase;
import com.aps.vitalpair.activity.domain.port.in.LogActivityUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/activity")
public class ActivityController {

    private final LogActivityUseCase logActivityUseCase;
    private final GetDailyActivitiesUseCase getDailyActivitiesUseCase;
    private final GetActivitySummaryUseCase getActivitySummaryUseCase;

    public ActivityController(
            LogActivityUseCase logActivityUseCase,
            GetDailyActivitiesUseCase getDailyActivitiesUseCase,
            GetActivitySummaryUseCase getActivitySummaryUseCase) {
        this.logActivityUseCase = logActivityUseCase;
        this.getDailyActivitiesUseCase = getDailyActivitiesUseCase;
        this.getActivitySummaryUseCase = getActivitySummaryUseCase;
    }

    @PostMapping("/logs")
    public ResponseEntity<ApiResponse<ActivityLogResponse>> log(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody LogActivityRequest request) {
        var command = new LogActivityCommand(
                request.activityType(), request.steps(), request.distanceKm(), request.caloriesBurned(),
                request.durationMinutes(), request.source(), request.externalId(), request.loggedAt());
        var saved = logActivityUseCase.logActivity(principal.userId(), command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ActivityLogResponse.from(saved), "Atividade registrada"));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> logs(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ActivityLogResponse> logs = getDailyActivitiesUseCase.getActivities(principal.userId(), orToday(date))
                .stream().map(ActivityLogResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ActivitySummaryResponse>> summary(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        var summary = getActivitySummaryUseCase.getSummary(principal.userId(), orToday(date));
        return ResponseEntity.ok(ApiResponse.ok(ActivitySummaryResponse.from(summary)));
    }

    private static LocalDate orToday(LocalDate date) {
        return date != null ? date : LocalDate.now();
    }
}
