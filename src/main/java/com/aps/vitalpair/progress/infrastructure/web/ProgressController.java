package com.aps.vitalpair.progress.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.progress.domain.model.ProgressWindow;
import com.aps.vitalpair.progress.domain.port.in.GetProgressUseCase;
import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Progress", description = "Weight, calories and macros over time.")
@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final GetProgressUseCase getProgressUseCase;
    private final RecordWeightUseCase recordWeightUseCase;

    public ProgressController(GetProgressUseCase getProgressUseCase, RecordWeightUseCase recordWeightUseCase) {
        this.getProgressUseCase = getProgressUseCase;
        this.recordWeightUseCase = recordWeightUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Weight history, calorie chart, macro averages",
            description =
                    "Weights oldest first, the calorie chart and the average macros, all over the window given in `days` (7, 30 or 90; 7 by default). The ninety-day chart groups its bars by week, because ninety daily bars do not fit a phone. Targets come back null when the profile is incomplete; the screen still renders.")
    @GetMapping
    public ResponseEntity<ApiResponse<ProgressResponse>> progress(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Parameter(description = "Window in days: 7, 30 or 90. Anything else falls back to 7.")
                    @RequestParam(required = false)
                    Integer days) {
        var view = getProgressUseCase.getProgress(principal.userId(), ProgressWindow.fromDays(days));
        return ResponseEntity.ok(ApiResponse.ok(ProgressResponse.from(view)));
    }

    @StandardApiResponses
    @Operation(
            summary = "Record today's weight",
            description = "One weight per day; recording again replaces today's entry. Only today can be recorded.")
    @PostMapping("/weight")
    public ResponseEntity<ApiResponse<Void>> recordWeight(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody RecordWeightRequest request) {
        recordWeightUseCase.recordTodayWeight(principal.userId(), request.weightKg());
        return ResponseEntity.ok(ApiResponse.ok(null, "Peso registrado"));
    }
}
