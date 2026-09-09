package com.aps.vitalpair.activity.application.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
import com.aps.vitalpair.shared.time.DayWindow;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.model.UserTimeZones;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class ActivityService implements LogActivityUseCase, GetDailyActivitiesUseCase, GetActivitySummaryUseCase {

    /** kcal per step for an average person (see ARQUITETURA.md, section 5.4). */
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
                // The user's day, not UTC's: this date is what the streak and the weekly
                // scoreboard are keyed on, so an activity logged at 21:00 in Brazil scored
                // against tomorrow and could break a streak the person had not broken.
                saved.getLoggedAt().atZone(user.zone()).toLocalDate(),
                saved.getActivityType().name(),
                saved.getCaloriesBurned() != null ? saved.getCaloriesBurned().intValue() : 0,
                saved.getDurationMinutes()));
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLog> getActivities(UUID userId, LocalDate date) {
        return activityLogRepository.findByUserAndDay(userId, dayOf(userId, date));
    }

    @Override
    @Transactional(readOnly = true)
    public ActivitySummary getSummary(UUID userId, LocalDate date) {
        List<ActivityLog> logs = activityLogRepository.findByUserAndDay(userId, dayOf(userId, date));
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

    /**
     * The day's boundaries in the user's own zone, not the server's.
     *
     * <p>A user who cannot be found gets the default zone rather than an exception: this is
     * only reached with the id of an already authenticated caller, so a miss means the account
     * was closed mid-request, and answering that with a 404 about the date would name the
     * wrong problem.
     */
    private DayWindow dayOf(UUID userId, LocalDate date) {
        ZoneId zone = userRepository.findById(userId).map(User::zone).orElse(UserTimeZones.FALLBACK);
        return DayWindow.of(date, zone);
    }

    /** The calories given; failing that, an estimate from steps; failing that, zero. */
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
