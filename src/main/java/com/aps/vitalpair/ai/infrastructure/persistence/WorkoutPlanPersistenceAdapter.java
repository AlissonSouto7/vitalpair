package com.aps.vitalpair.ai.infrastructure.persistence;

import com.aps.vitalpair.ai.domain.model.WorkoutDay;
import com.aps.vitalpair.ai.domain.model.WorkoutExercise;
import com.aps.vitalpair.ai.domain.model.WorkoutPlan;
import com.aps.vitalpair.ai.domain.port.out.WorkoutPlanRepositoryPort;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Adaptador JPA do plano de treino. {@code replace} apaga exercícios, dias e plano da mesma
 * semana antes de inserir o novo (respeitando o UNIQUE user_id/week_start). As leituras devolvem
 * dias ordenados por {@code dayIndex} e exercícios por {@code position}.
 */
@Component
public class WorkoutPlanPersistenceAdapter implements WorkoutPlanRepositoryPort {

    private final WorkoutPlanJpaRepository planRepository;
    private final WorkoutDayJpaRepository dayRepository;
    private final WorkoutExerciseJpaRepository exerciseRepository;

    public WorkoutPlanPersistenceAdapter(
            WorkoutPlanJpaRepository planRepository,
            WorkoutDayJpaRepository dayRepository,
            WorkoutExerciseJpaRepository exerciseRepository) {
        this.planRepository = planRepository;
        this.dayRepository = dayRepository;
        this.exerciseRepository = exerciseRepository;
    }

    @Override
    public Optional<WorkoutPlan> findByUserAndWeek(UUID userId, LocalDate weekStart) {
        return planRepository.findByUserIdAndWeekStart(userId, weekStart).map(this::toDomain);
    }

    @Override
    public WorkoutPlan replace(WorkoutPlan plan) {
        planRepository.findByUserIdAndWeekStart(plan.userId(), plan.weekStart()).ifPresent(existing -> {
            List<UUID> dayIds = dayRepository.findByPlanId(existing.getId()).stream()
                    .map(WorkoutDayJpaEntity::getId)
                    .toList();
            if (!dayIds.isEmpty()) {
                exerciseRepository.deleteByDayIdIn(dayIds);
            }
            dayRepository.deleteByPlanId(existing.getId());
            planRepository.delete(existing);
            planRepository.flush();
        });

        WorkoutPlanJpaEntity savedPlan = planRepository.save(WorkoutPlanJpaEntity.builder()
                .userId(plan.userId())
                .weekStart(plan.weekStart())
                .goal(plan.goal())
                .createdAt(Instant.now())
                .build());
        for (WorkoutDay day : plan.days()) {
            WorkoutDayJpaEntity savedDay = dayRepository.save(WorkoutDayJpaEntity.builder()
                    .planId(savedPlan.getId())
                    .dayIndex(day.dayIndex())
                    .focus(day.focus())
                    .durationMin(day.durationMin())
                    .rest(day.rest())
                    .completedOn(day.completedOn())
                    .build());
            exerciseRepository.saveAll(day.exercises().stream()
                    .map(exercise -> WorkoutExerciseJpaEntity.builder()
                            .dayId(savedDay.getId())
                            .position(exercise.position())
                            .name(exercise.name())
                            .sets(exercise.sets())
                            .reps(exercise.reps())
                            .restSeconds(exercise.restSeconds())
                            .done(exercise.done())
                            .build())
                    .toList());
        }
        return toDomain(savedPlan);
    }

    @Override
    public Optional<WorkoutPlan> findByExerciseId(UUID exerciseId) {
        return exerciseRepository.findById(exerciseId)
                .flatMap(exercise -> dayRepository.findById(exercise.getDayId()))
                .flatMap(day -> planRepository.findById(day.getPlanId()))
                .map(this::toDomain);
    }

    @Override
    public void setExerciseDone(UUID exerciseId, boolean done) {
        exerciseRepository.findById(exerciseId).ifPresent(exercise -> {
            exercise.setDone(done);
            exerciseRepository.save(exercise);
        });
    }

    @Override
    public void setDayCompleted(UUID dayId, LocalDate completedOn) {
        dayRepository.findById(dayId).ifPresent(day -> {
            day.setCompletedOn(completedOn);
            dayRepository.save(day);
        });
    }

    private WorkoutPlan toDomain(WorkoutPlanJpaEntity entity) {
        List<WorkoutDayJpaEntity> dayEntities = dayRepository.findByPlanId(entity.getId());
        Map<UUID, List<WorkoutExerciseJpaEntity>> exercisesByDay = dayEntities.isEmpty()
                ? Map.of()
                : exerciseRepository.findByDayIdIn(dayEntities.stream().map(WorkoutDayJpaEntity::getId).toList())
                        .stream()
                        .collect(Collectors.groupingBy(WorkoutExerciseJpaEntity::getDayId));

        List<WorkoutDay> days = new ArrayList<>();
        for (WorkoutDayJpaEntity day : dayEntities) {
            List<WorkoutExercise> exercises = exercisesByDay.getOrDefault(day.getId(), List.of()).stream()
                    .sorted(Comparator.comparingInt(WorkoutExerciseJpaEntity::getPosition))
                    .map(exercise -> new WorkoutExercise(
                            exercise.getId(), exercise.getPosition(), exercise.getName(),
                            exercise.getSets(), exercise.getReps(), exercise.getRestSeconds(), exercise.isDone()))
                    .toList();
            days.add(new WorkoutDay(
                    day.getId(), day.getDayIndex(), day.getFocus(), day.getDurationMin(),
                    day.isRest(), day.getCompletedOn(), exercises));
        }
        days.sort(Comparator.comparingInt(WorkoutDay::dayIndex));
        return new WorkoutPlan(entity.getId(), entity.getUserId(), entity.getWeekStart(), entity.getGoal(), days);
    }
}
