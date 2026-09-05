package com.aps.vitalpair.ai.application.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.model.ActivitySource;
import com.aps.vitalpair.activity.domain.model.ActivityType;
import com.aps.vitalpair.activity.domain.port.in.LogActivityUseCase;
import com.aps.vitalpair.ai.application.dto.WorkoutToday;
import com.aps.vitalpair.ai.domain.exception.WorkoutAlreadyCompletedException;
import com.aps.vitalpair.ai.domain.model.WorkoutDay;
import com.aps.vitalpair.ai.domain.model.WorkoutExercise;
import com.aps.vitalpair.ai.domain.model.WorkoutPlan;
import com.aps.vitalpair.ai.domain.port.in.CompleteWorkoutUseCase;
import com.aps.vitalpair.ai.domain.port.in.GenerateWorkoutPlanUseCase;
import com.aps.vitalpair.ai.domain.port.in.GetTodayWorkoutUseCase;
import com.aps.vitalpair.ai.domain.port.in.ToggleWorkoutExerciseUseCase;
import com.aps.vitalpair.ai.domain.port.out.WorkoutPlanGeneratorPort;
import com.aps.vitalpair.ai.domain.port.out.WorkoutPlanRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Casos de uso do plano de treino semanal por IA. Concluir o treino de hoje registra uma
 * atividade WORKOUT pelo {@link LogActivityUseCase} da feature activity, que já dispara
 * pontos, feed e streak; nada de somar pontos na mão aqui.
 */
@Service
public class WorkoutPlanService
        implements GetTodayWorkoutUseCase,
                GenerateWorkoutPlanUseCase,
                ToggleWorkoutExerciseUseCase,
                CompleteWorkoutUseCase {

    private final WorkoutPlanRepositoryPort workoutPlanRepository;
    private final WorkoutPlanGeneratorPort generator;
    private final UserRepositoryPort userRepository;
    private final LogActivityUseCase logActivityUseCase;

    public WorkoutPlanService(
            WorkoutPlanRepositoryPort workoutPlanRepository,
            WorkoutPlanGeneratorPort generator,
            UserRepositoryPort userRepository,
            LogActivityUseCase logActivityUseCase) {
        this.workoutPlanRepository = workoutPlanRepository;
        this.generator = generator;
        this.userRepository = userRepository;
        this.logActivityUseCase = logActivityUseCase;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WorkoutToday> getToday(UUID userId) {
        return workoutPlanRepository
                .findByUserAndWeek(userId, currentWeekStart())
                .map(WorkoutPlanService::todayView);
    }

    @Override
    @Transactional
    public WorkoutToday generate(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        if (user.getGoal() == null) {
            throw new BusinessRuleException("Escolhe teu objetivo no perfil primeiro.");
        }

        List<WorkoutDay> days = generator.generateWeek(user.getGoal(), user.getActivityLevel());
        WorkoutPlan saved =
                workoutPlanRepository.replace(new WorkoutPlan(null, userId, currentWeekStart(), user.getGoal(), days));
        return todayView(saved);
    }

    @Override
    @Transactional
    public WorkoutToday toggle(UUID userId, UUID exerciseId) {
        WorkoutPlan plan = workoutPlanRepository
                .findByExerciseId(exerciseId)
                .filter(found -> found.userId().equals(userId))
                .orElseThrow(() -> ResourceNotFoundException.of("Exercício", exerciseId));

        WorkoutExercise exercise = plan.days().stream()
                .flatMap(day -> day.exercises().stream())
                .filter(candidate -> candidate.id().equals(exerciseId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("Exercício", exerciseId));

        workoutPlanRepository.setExerciseDone(exerciseId, !exercise.done());
        return requireToday(userId);
    }

    @Override
    @Transactional
    public WorkoutToday complete(UUID userId) {
        WorkoutPlan plan = workoutPlanRepository
                .findByUserAndWeek(userId, currentWeekStart())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plano de treino da semana não encontrado. Gere o plano primeiro."));

        WorkoutDay today = dayOf(plan, todayIndex()).orElse(null);
        if (today == null || today.rest()) {
            throw new BusinessRuleException("Hoje é dia de descanso, não tem treino pra concluir.");
        }
        if (today.completedOn() != null) {
            throw new WorkoutAlreadyCompletedException("O treino de hoje já foi concluído. Bora descansar!");
        }

        workoutPlanRepository.setDayCompleted(today.id(), LocalDate.now());
        logActivityUseCase.logActivity(
                userId,
                new LogActivityCommand(
                        ActivityType.WORKOUT,
                        null,
                        null,
                        null,
                        today.durationMin(),
                        ActivitySource.MANUAL,
                        null,
                        null));
        return requireToday(userId);
    }

    private WorkoutToday requireToday(UUID userId) {
        return getToday(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plano de treino da semana não encontrado."));
    }

    /** Monta a visão do dia atual; dia ausente no plano é tratado como descanso. */
    private static WorkoutToday todayView(WorkoutPlan plan) {
        int dayIndex = todayIndex();
        WorkoutDay day = dayOf(plan, dayIndex).orElse(null);
        if (day == null || day.rest()) {
            boolean completed = day != null && day.completedOn() != null;
            return new WorkoutToday(plan.goal().name(), dayIndex, true, null, null, completed, List.of());
        }
        List<WorkoutToday.Exercise> exercises = day.exercises().stream()
                .map(exercise -> new WorkoutToday.Exercise(
                        exercise.id(),
                        exercise.name(),
                        exercise.sets(),
                        exercise.reps(),
                        exercise.restSeconds(),
                        exercise.done()))
                .toList();
        return new WorkoutToday(
                plan.goal().name(),
                dayIndex,
                false,
                day.focus(),
                day.durationMin(),
                day.completedOn() != null,
                exercises);
    }

    private static Optional<WorkoutDay> dayOf(WorkoutPlan plan, int dayIndex) {
        return plan.days().stream().filter(day -> day.dayIndex() == dayIndex).findFirst();
    }

    /** Índice de hoje na semana do plano (0 = segunda ... 6 = domingo). */
    private static int todayIndex() {
        return LocalDate.now().getDayOfWeek().getValue() - 1;
    }

    /** Segunda-feira da semana atual. */
    private static LocalDate currentWeekStart() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
