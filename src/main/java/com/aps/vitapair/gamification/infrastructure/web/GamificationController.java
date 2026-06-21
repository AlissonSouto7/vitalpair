package com.aps.vitapair.gamification.infrastructure.web;

import com.aps.vitapair.gamification.domain.port.in.GetCompetitionUseCase;
import com.aps.vitapair.gamification.domain.port.in.GetStreaksUseCase;
import com.aps.vitapair.shared.security.AuthenticatedUser;
import com.aps.vitapair.shared.web.ApiResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/gamification")
public class GamificationController {

    private final GetStreaksUseCase getStreaksUseCase;
    private final GetCompetitionUseCase getCompetitionUseCase;

    public GamificationController(
            GetStreaksUseCase getStreaksUseCase, GetCompetitionUseCase getCompetitionUseCase) {
        this.getStreaksUseCase = getStreaksUseCase;
        this.getCompetitionUseCase = getCompetitionUseCase;
    }

    @GetMapping("/streaks")
    public ResponseEntity<ApiResponse<List<StreakResponse>>> streaks(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<StreakResponse> streaks = getStreaksUseCase.getStreaks(principal.userId()).stream()
                .map(StreakResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(streaks));
    }

    @GetMapping("/competition")
    public ResponseEntity<ApiResponse<CompetitionResponse>> competition(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var score = getCompetitionUseCase.getCurrentCompetition(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(CompetitionResponse.from(score)));
    }
}
