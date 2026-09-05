package com.aps.vitalpair.pair.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.pair.domain.port.in.GenerateInviteUseCase;
import com.aps.vitalpair.pair.domain.port.in.GetCurrentPairUseCase;
import com.aps.vitalpair.pair.domain.port.in.GetInvitePreviewUseCase;
import com.aps.vitalpair.pair.domain.port.in.JoinPairUseCase;
import com.aps.vitalpair.pair.domain.port.in.UpdateRelationshipTypeUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;

@RestController
@RequestMapping("/api/v1/pair")
public class PairController {

    private final GetCurrentPairUseCase getCurrentPairUseCase;
    private final GenerateInviteUseCase generateInviteUseCase;
    private final JoinPairUseCase joinPairUseCase;
    private final UpdateRelationshipTypeUseCase updateRelationshipTypeUseCase;
    private final GetInvitePreviewUseCase getInvitePreviewUseCase;

    public PairController(
            GetCurrentPairUseCase getCurrentPairUseCase,
            GenerateInviteUseCase generateInviteUseCase,
            JoinPairUseCase joinPairUseCase,
            UpdateRelationshipTypeUseCase updateRelationshipTypeUseCase,
            GetInvitePreviewUseCase getInvitePreviewUseCase) {
        this.getCurrentPairUseCase = getCurrentPairUseCase;
        this.generateInviteUseCase = generateInviteUseCase;
        this.joinPairUseCase = joinPairUseCase;
        this.updateRelationshipTypeUseCase = updateRelationshipTypeUseCase;
        this.getInvitePreviewUseCase = getInvitePreviewUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PairResponse>> current(@AuthenticationPrincipal AuthenticatedUser principal) {
        var view = getCurrentPairUseCase.getCurrentPair(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(PairResponse.from(view)));
    }

    @GetMapping("/invite/{code}")
    public ResponseEntity<ApiResponse<InvitePreviewResponse>> invitePreview(@PathVariable String code) {
        var preview = getInvitePreviewUseCase.getInvitePreview(code);
        return ResponseEntity.ok(ApiResponse.ok(InvitePreviewResponse.from(preview)));
    }

    @PostMapping("/invite")
    public ResponseEntity<ApiResponse<PairResponse>> invite(@AuthenticationPrincipal AuthenticatedUser principal) {
        var view = generateInviteUseCase.generateInvite(principal.userId());
        return ResponseEntity.ok(
                ApiResponse.ok(PairResponse.from(view), "Compartilhe o código de convite com seu parceiro"));
    }

    @PutMapping("/type")
    public ResponseEntity<ApiResponse<PairResponse>> updateType(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateRelationshipTypeRequest request) {
        var view = updateRelationshipTypeUseCase.updateRelationshipType(principal.userId(), request.type());
        return ResponseEntity.ok(ApiResponse.ok(PairResponse.from(view), "Tipo de relação atualizado"));
    }

    @PostMapping("/join/{code}")
    public ResponseEntity<ApiResponse<PairResponse>> join(
            @AuthenticationPrincipal AuthenticatedUser principal, @PathVariable String code) {
        var view = joinPairUseCase.joinPair(principal.userId(), code);
        return ResponseEntity.ok(ApiResponse.ok(PairResponse.from(view), "Par formado com sucesso"));
    }
}
