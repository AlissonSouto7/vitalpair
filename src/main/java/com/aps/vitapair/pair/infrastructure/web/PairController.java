package com.aps.vitapair.pair.infrastructure.web;

import com.aps.vitapair.pair.domain.port.in.GenerateInviteUseCase;
import com.aps.vitapair.pair.domain.port.in.GetCurrentPairUseCase;
import com.aps.vitapair.pair.domain.port.in.JoinPairUseCase;
import com.aps.vitapair.shared.security.AuthenticatedUser;
import com.aps.vitapair.shared.web.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pair")
public class PairController {

    private final GetCurrentPairUseCase getCurrentPairUseCase;
    private final GenerateInviteUseCase generateInviteUseCase;
    private final JoinPairUseCase joinPairUseCase;

    public PairController(
            GetCurrentPairUseCase getCurrentPairUseCase,
            GenerateInviteUseCase generateInviteUseCase,
            JoinPairUseCase joinPairUseCase) {
        this.getCurrentPairUseCase = getCurrentPairUseCase;
        this.generateInviteUseCase = generateInviteUseCase;
        this.joinPairUseCase = joinPairUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PairResponse>> current(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = getCurrentPairUseCase.getCurrentPair(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(PairResponse.from(view)));
    }

    @PostMapping("/invite")
    public ResponseEntity<ApiResponse<PairResponse>> invite(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var view = generateInviteUseCase.generateInvite(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(PairResponse.from(view), "Compartilhe o código de convite com seu parceiro"));
    }

    @PostMapping("/join/{code}")
    public ResponseEntity<ApiResponse<PairResponse>> join(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable String code) {
        var view = joinPairUseCase.joinPair(principal.userId(), code);
        return ResponseEntity.ok(ApiResponse.ok(PairResponse.from(view), "Par formado com sucesso"));
    }
}
