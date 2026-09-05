package com.aps.vitalpair.activity.application.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;
import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.model.ActivityLog;
import com.aps.vitalpair.activity.domain.port.in.GetActivitySummaryUseCase;
import com.aps.vitalpair.activity.domain.port.in.GetDailyActivitiesUseCase;
import com.aps.vitalpair.activity.domain.port.in.LogActivityUseCase;
import com.aps.vitalpair.activity.domain.port.out.ActivityLogRepositoryPort;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class ActivityService implements LogActivityUseCase, GetDailyActivitiesUseCase, GetActivitySummaryUseCase {

    /** kcal por passo para pessoa média (ver §5.4). */
    private static final BigDecimal KCAL_PER_STEP = new BigDecimal("0.04");

    private final ActivityLogRepositoryPort activityLogRepository;
    private final UserRepositoryPort userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ActivityService(
            ActivityLogRepositoryPort activityLogRepository,
            UserRepositoryPort userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public ActivityLog logActivity(UUID userId, LogActivityCommand command) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        ActivityLog log = ActivityLog.builder()
                .tenantId(user.getTenantId())
                .userId(userId)
                .activityType(command.activityType())
                .steps(command.steps())
                .distanceKm(command.distanceKm())
                .caloriesBurned(resolveCalories(command))
                .durationMinutes(command.durationMinutes())
                .source(command.source())
                .externalId(command.externalId())
                .loggedAt(command.loggedAt() != null ? command.loggedAt() : Instant.now())
                .build();
        ActivityLog saved = activityLogRepository.save(log);
        eventPublisher.publishEvent(new ActivityLoggedEvent(
                userId,
                saved.getTenantId(),
                saved.getLoggedAt().atZone(ZoneOffset.UTC).toLocalDate(),
                saved.getActivityType().name(),
                saved.getCaloriesBurned() != null ? saved.getCaloriesBurned().intValue() : 0,
                saved.getDurationMinutes()));
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLog> getActivities(UUID userId, LocalDate date) {
        return activityLogRepository.findByUserAndDate(userId, date);
    }

    @Override
    @Transactional(readOnly = true)
    public ActivitySummary getSummary(UUID userId, LocalDate date) {
        List<ActivityLog> logs = activityLogRepository.findByUserAndDate(userId, date);
        int calories = logs.stream()
                .map(ActivityLog::getCaloriesBurned)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
        int steps = logs.stream()
                .map(ActivityLog::getSteps)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        return new ActivitySummary(date, calories, steps, logs.size());
    }

    /** Usa as calorias informadas; senão estima a partir dos passos; senão zero. */
    private BigDecimal resolveCalories(LogActivityCommand command) {
        if (command.caloriesBurned() != null) {
            return command.caloriesBurned();
        }
        if (command.steps() != null) {
            return KCAL_PER_STEP.multiply(BigDecimal.valueOf(command.steps())).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
