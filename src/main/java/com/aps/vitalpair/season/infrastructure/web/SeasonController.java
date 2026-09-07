package com.aps.vitalpair.season.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.season.domain.port.in.GetSeasonUseCase;
import com.aps.vitalpair.season.domain.port.in.UpdateStakeUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Season", description = "The current season and the stake the pair agreed on.")
@RestController
@RequestMapping("/api/v1/season")
public class SeasonController {

    private final GetSeasonUseCase getSeasonUseCase;
    private final UpdateStakeUseCase updateStakeUseCase;

    public SeasonController(GetSeasonUseCase getSeasonUseCase, UpdateStakeUseCase updateStakeUseCase) {
        this.getSeasonUseCase = getSeasonUseCase;
        this.updateStakeUseCase = updateStakeUseCase;
    }

    @StandardApiResponses
    @GetMapping
    public ResponseEntity<ApiResponse<SeasonResponse>> current(@AuthenticationPrincipal AuthenticatedUser principal) {
        var view = getSeasonUseCase.getCurrentSeason(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(SeasonResponse.from(view)));
    }

    @StandardApiResponses
    @PutMapping("/stake")
    public ResponseEntity<ApiResponse<SeasonResponse>> updateStake(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody UpdateStakeRequest request) {
        var view = updateStakeUseCase.updateStake(principal.userId(), request.stake());
        return ResponseEntity.ok(ApiResponse.ok(SeasonResponse.from(view)));
    }
}
