package com.aps.vitalpair.activity.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.port.in.DeleteActivityLogUseCase;
import com.aps.vitalpair.activity.domain.port.in.GetActivitySummaryUseCase;
import com.aps.vitalpair.activity.domain.port.in.GetDailyActivitiesUseCase;
import com.aps.vitalpair.activity.domain.port.in.LogActivityUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Activity", description = "Logging workouts, steps and distance, and the day's summary.")
@RestController
@RequestMapping("/api/v1/activity")
public class ActivityController {

    private final LogActivityUseCase logActivityUseCase;
    private final GetDailyActivitiesUseCase getDailyActivitiesUseCase;
    private final GetActivitySummaryUseCase getActivitySummaryUseCase;
    private final DeleteActivityLogUseCase deleteActivityLogUseCase;
    private final UserDayUseCase userDayUseCase;

    public ActivityController(
            LogActivityUseCase logActivityUseCase,
            GetDailyActivitiesUseCase getDailyActivitiesUseCase,
            GetActivitySummaryUseCase getActivitySummaryUseCase,
            DeleteActivityLogUseCase deleteActivityLogUseCase,
            UserDayUseCase userDayUseCase) {
        this.logActivityUseCase = logActivityUseCase;
        this.getDailyActivitiesUseCase = getDailyActivitiesUseCase;
        this.getActivitySummaryUseCase = getActivitySummaryUseCase;
        this.deleteActivityLogUseCase = deleteActivityLogUseCase;
        this.userDayUseCase = userDayUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Log an activity",
            description =
                    "Records steps, a run, a ride or a workout. Calories come from the request when given, are estimated from steps (0.04 kcal per step) otherwise, and default to zero. Publishes an event that scores points, appears in the pair's feed and notifies the partner.")
    @PostMapping("/logs")
    public ResponseEntity<ApiResponse<ActivityLogResponse>> log(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody LogActivityRequest request) {
        var command = new LogActivityCommand(
                request.activityType(),
                request.steps(),
                request.distanceKm(),
                request.caloriesBurned(),
                request.durationMinutes(),
                request.source(),
                request.externalId(),
                request.loggedAt());
        var saved = logActivityUseCase.logActivity(principal.userId(), command);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ActivityLogResponse.from(saved), "Atividade registrada"));
    }

    @StandardApiResponses
    @Operation(
            summary = "The day's activities",
            description =
                    "Every activity the caller logged on the given date, defaulting to today. Days run midnight to midnight in UTC.")
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> logs(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        List<ActivityLogResponse> logs =
                getDailyActivitiesUseCase.getActivities(principal.userId(), orToday(principal, date)).stream()
                        .map(ActivityLogResponse::from)
                        .toList();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @StandardApiResponses
    @Operation(
            summary = "Calories burned and steps for a day",
            description =
                    "Totals for the caller on the given date: calories burned (rounded), steps and the number of activities.")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ActivitySummaryResponse>> summary(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        var summary = getActivitySummaryUseCase.getSummary(principal.userId(), orToday(principal, date));
        return ResponseEntity.ok(ApiResponse.ok(ActivitySummaryResponse.from(summary)));
    }

    @StandardApiResponses
    @Operation(
            summary = "Delete an activity",
            description =
                    "Removes one of the caller's own activities and the item it left in the pair's feed. Another person's record answers 404, not 403, so the endpoint cannot be used to probe ids. Points already awarded are not taken back: they were earned on the day it was logged.")
    @DeleteMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal AuthenticatedUser principal, @PathVariable UUID id) {
        deleteActivityLogUseCase.delete(principal.userId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Registro removido"));
    }

    /**
     * The requested date, or today where the caller is.
     *
     * <p>Not {@code LocalDate.now()}: that is today where the server is, which used to disagree
     * with the window the query ran over.
     */
    private LocalDate orToday(AuthenticatedUser principal, LocalDate date) {
        return date != null ? date : userDayUseCase.today(principal.userId());
    }
}
