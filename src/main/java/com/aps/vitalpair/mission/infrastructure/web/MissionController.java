package com.aps.vitalpair.mission.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.mission.domain.port.in.AcceptFlashMissionUseCase;
import com.aps.vitalpair.mission.domain.port.in.GetFlashMissionUseCase;
import com.aps.vitalpair.mission.domain.port.in.GetWeeklyMissionsUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Missions", description = "The daily flash mission and the weekly set.")
@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {

    private final GetFlashMissionUseCase getFlashMissionUseCase;
    private final AcceptFlashMissionUseCase acceptFlashMissionUseCase;
    private final GetWeeklyMissionsUseCase getWeeklyMissionsUseCase;

    public MissionController(
            GetFlashMissionUseCase getFlashMissionUseCase,
            AcceptFlashMissionUseCase acceptFlashMissionUseCase,
            GetWeeklyMissionsUseCase getWeeklyMissionsUseCase) {
        this.getFlashMissionUseCase = getFlashMissionUseCase;
        this.acceptFlashMissionUseCase = acceptFlashMissionUseCase;
        this.getWeeklyMissionsUseCase = getWeeklyMissionsUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Today's flash mission",
            description =
                    "The same small challenge for everybody today, chosen from the day of the year, and whether the caller's pair has accepted it.")
    @GetMapping("/flash")
    public ResponseEntity<ApiResponse<FlashMissionResponse>> flash(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = getFlashMissionUseCase.getToday(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(FlashMissionResponse.from(view)));
    }

    @StandardApiResponses
    @Operation(
            summary = "Accept today's mission",
            description =
                    "Marks the mission accepted for the whole pair: either member accepting turns it on for both. Accepting twice does nothing.")
    @PostMapping("/flash/accept")
    public ResponseEntity<ApiResponse<FlashMissionResponse>> acceptFlash(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = acceptFlashMissionUseCase.acceptToday(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(FlashMissionResponse.from(view)));
    }

    @StandardApiResponses
    @Operation(
            summary = "This week's targets",
            description =
                    "Each weekly mission with the caller's progress so far, counted live from the real meal and activity logs. A pair mission also shows the partner's progress and can only be completed by both.")
    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<WeeklyMissionResponse>>> weekly(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<WeeklyMissionResponse> missions = getWeeklyMissionsUseCase.getCurrentWeek(principal.userId()).stream()
                .map(WeeklyMissionResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(missions));
    }
}
