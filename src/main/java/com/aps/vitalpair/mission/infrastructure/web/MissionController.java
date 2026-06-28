package com.aps.vitalpair.mission.infrastructure.web;

import com.aps.vitalpair.mission.domain.port.in.AcceptFlashMissionUseCase;
import com.aps.vitalpair.mission.domain.port.in.GetFlashMissionUseCase;
import com.aps.vitalpair.mission.domain.port.in.GetWeeklyMissionsUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/flash")
    public ResponseEntity<ApiResponse<FlashMissionResponse>> flash(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = getFlashMissionUseCase.getToday(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(FlashMissionResponse.from(view)));
    }

    @PostMapping("/flash/accept")
    public ResponseEntity<ApiResponse<FlashMissionResponse>> acceptFlash(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = acceptFlashMissionUseCase.acceptToday(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(FlashMissionResponse.from(view)));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<WeeklyMissionResponse>>> weekly(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<WeeklyMissionResponse> missions =
                getWeeklyMissionsUseCase.getCurrentWeek(principal.userId()).stream()
                        .map(WeeklyMissionResponse::from)
                        .toList();
        return ResponseEntity.ok(ApiResponse.ok(missions));
    }
}
