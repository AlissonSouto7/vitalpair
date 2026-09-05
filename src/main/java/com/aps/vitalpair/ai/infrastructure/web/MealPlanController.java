package com.aps.vitalpair.ai.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.ai.application.dto.SwapMealCommand;
import com.aps.vitalpair.ai.domain.port.in.GenerateMealPlanUseCase;
import com.aps.vitalpair.ai.domain.port.in.GetMealPlanUseCase;
import com.aps.vitalpair.ai.domain.port.in.SwapMealUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;

/**
 * Plano alimentar semanal por IA. O GET devolve {@code data: null} (200) enquanto o usuário
 * ainda não gerou o plano da semana atual; gerar substitui o plano inteiro.
 */
@RestController
@RequestMapping("/api/v1/meal-plan")
public class MealPlanController {

    private final GetMealPlanUseCase getMealPlanUseCase;
    private final GenerateMealPlanUseCase generateMealPlanUseCase;
    private final SwapMealUseCase swapMealUseCase;

    public MealPlanController(
            GetMealPlanUseCase getMealPlanUseCase,
            GenerateMealPlanUseCase generateMealPlanUseCase,
            SwapMealUseCase swapMealUseCase) {
        this.getMealPlanUseCase = getMealPlanUseCase;
        this.generateMealPlanUseCase = generateMealPlanUseCase;
        this.swapMealUseCase = swapMealUseCase;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<MealPlanResponse>> current(@AuthenticationPrincipal AuthenticatedUser principal) {
        MealPlanResponse plan = getMealPlanUseCase
                .getCurrentWeekPlan(principal.userId())
                .map(MealPlanResponse::from)
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(plan));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<MealPlanResponse>> generate(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        MealPlanResponse plan = MealPlanResponse.from(generateMealPlanUseCase.generate(principal.userId()));
        return ResponseEntity.ok(ApiResponse.ok(plan, "Cardápio da semana gerado"));
    }

    @PostMapping("/swap")
    public ResponseEntity<ApiResponse<MealPlanResponse>> swap(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody SwapMealRequest request) {
        MealPlanResponse plan = MealPlanResponse.from(
                swapMealUseCase.swap(principal.userId(), new SwapMealCommand(request.dayIndex(), request.mealType())));
        return ResponseEntity.ok(ApiResponse.ok(plan, "Refeição trocada"));
    }
}
