package com.aps.vitalpair.entitlement.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.entitlement.domain.port.in.AiEntitlementUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Entitlements", description = "Which paid features the caller may use.")
@RestController
@RequestMapping("/api/v1/entitlements")
public class EntitlementController {

    private final AiEntitlementUseCase aiEntitlement;

    public EntitlementController(AiEntitlementUseCase aiEntitlement) {
        this.aiEntitlement = aiEntitlement;
    }

    @StandardApiResponses
    @Operation(
            summary = "The caller's plan and AI access",
            description =
                    "The caller's own plan and whether the AI features (meal plan, workout plan, meal photo) are open to them. Access comes from their own PREMIUM plan or, while their pair is active, from the partner's; a pair that ends takes the borrowed access with it. The interface reads this before showing a paid feature, so a person without the plan sees the paid-plan notice rather than a refused call.")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EntitlementResponse>> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(
                ApiResponse.ok(EntitlementResponse.from(aiEntitlement.entitlementOf(principal.userId()))));
    }
}
