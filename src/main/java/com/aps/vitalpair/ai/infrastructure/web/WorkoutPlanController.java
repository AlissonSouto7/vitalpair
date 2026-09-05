package com.aps.vitalpair.ai.infrastructure.web;

import com.aps.vitalpair.ai.domain.port.in.CompleteWorkoutUseCase;
import com.aps.vitalpair.ai.domain.port.in.GenerateWorkoutPlanUseCase;
import com.aps.vitalpair.ai.domain.port.in.GetTodayWorkoutUseCase;
import com.aps.vitalpair.ai.domain.port.in.ToggleWorkoutExerciseUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Plano de treino semanal por IA. O GET /today devolve {@code data: null} (200) enquanto o
 * usuário ainda não gerou o plano da semana. Concluir o dia registra uma atividade WORKOUT
 * pela feature activity (pontos/feed/streak automáticos); concluir duas vezes responde 409.
 */
@RestController
@RequestMapping("/api/v1/workout-plan")
public class WorkoutPlanController {

    private final GetTodayWorkoutUseCase getTodayWorkoutUseCase;
    private final GenerateWorkoutPlanUseCase generateWorkoutPlanUseCase;
    private final ToggleWorkoutExerciseUseCase toggleWorkoutExerciseUseCase;
    private final CompleteWorkoutUseCase completeWorkoutUseCase;

    public WorkoutPlanController(
            GetTodayWorkoutUseCase getTodayWorkoutUseCase,
            GenerateWorkoutPlanUseCase generateWorkoutPlanUseCase,
            ToggleWorkoutExerciseUseCase toggleWorkoutExerciseUseCase,
            CompleteWorkoutUseCase completeWorkoutUseCase) {
        this.getTodayWorkoutUseCase = getTodayWorkoutUseCase;
        this.generateWorkoutPlanUseCase = generateWorkoutPlanUseCase;
        this.toggleWorkoutExerciseUseCase = toggleWorkoutExerciseUseCase;
        this.completeWorkoutUseCase = completeWorkoutUseCase;
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<WorkoutTodayResponse>> today(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        WorkoutTodayResponse today = getTodayWorkoutUseCase.getToday(principal.userId())
                .map(WorkoutTodayResponse::from)
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(today));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<WorkoutTodayResponse>> generate(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        WorkoutTodayResponse today =
                WorkoutTodayResponse.from(generateWorkoutPlanUseCase.generate(principal.userId()));
        return ResponseEntity.ok(ApiResponse.ok(today, "Plano de treino da semana gerado"));
    }

    @PostMapping("/exercises/{id}/toggle")
    public ResponseEntity<ApiResponse<WorkoutTodayResponse>> toggle(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable("id") UUID exerciseId) {
        WorkoutTodayResponse today =
                WorkoutTodayResponse.from(toggleWorkoutExerciseUseCase.toggle(principal.userId(), exerciseId));
        return ResponseEntity.ok(ApiResponse.ok(today));
    }

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<WorkoutTodayResponse>> complete(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        WorkoutTodayResponse today =
                WorkoutTodayResponse.from(completeWorkoutUseCase.complete(principal.userId()));
        return ResponseEntity.ok(ApiResponse.ok(today, "Treino de hoje concluído"));
    }
}
