package com.aps.vitalpair.gamification.infrastructure.web;

import com.aps.vitalpair.gamification.domain.port.in.GetBadgeCatalogUseCase;
import com.aps.vitalpair.gamification.domain.port.in.GetCompetitionUseCase;
import com.aps.vitalpair.gamification.domain.port.in.GetStreaksUseCase;
import com.aps.vitalpair.gamification.domain.port.in.GetUserBadgesUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
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
    private final GetUserBadgesUseCase getUserBadgesUseCase;
    private final GetBadgeCatalogUseCase getBadgeCatalogUseCase;

    public GamificationController(
            GetStreaksUseCase getStreaksUseCase,
            GetCompetitionUseCase getCompetitionUseCase,
            GetUserBadgesUseCase getUserBadgesUseCase,
            GetBadgeCatalogUseCase getBadgeCatalogUseCase) {
        this.getStreaksUseCase = getStreaksUseCase;
        this.getCompetitionUseCase = getCompetitionUseCase;
        this.getUserBadgesUseCase = getUserBadgesUseCase;
        this.getBadgeCatalogUseCase = getBadgeCatalogUseCase;
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

    @GetMapping("/badges")
    public ResponseEntity<ApiResponse<List<EarnedBadgeResponse>>> badges(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<EarnedBadgeResponse> badges = getUserBadgesUseCase.getUserBadges(principal.userId()).stream()
                .map(EarnedBadgeResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(badges));
    }

    @GetMapping("/badges/catalog")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> badgeCatalog() {
        List<BadgeResponse> catalog = getBadgeCatalogUseCase.getCatalog().stream()
                .map(BadgeResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(catalog));
    }
}
