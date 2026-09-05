package com.aps.vitalpair.activity.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;
import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.model.ActivityLog;
import com.aps.vitalpair.activity.domain.model.ActivitySource;
import com.aps.vitalpair.activity.domain.model.ActivityType;
import com.aps.vitalpair.activity.domain.port.out.ActivityLogRepositoryPort;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();

    @Mock
    private ActivityLogRepositoryPort activityLogRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ActivityService service;

    @Test
    void logActivityEstimaCaloriasAPartirDosPassos() {
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(User.builder()
                        .id(USER_ID)
                        .tenantId(TENANT_ID)
                        .email("a@a.com")
                        .name("Ana")
                        .build()));
        when(activityLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var command =
                new LogActivityCommand(ActivityType.STEPS, 10_000, null, null, null, ActivitySource.MANUAL, null, null);

        ActivityLog saved = service.logActivity(USER_ID, command);

        // 10000 passos x 0.04 = 400 kcal
        assertThat(saved.getCaloriesBurned()).isEqualByComparingTo("400.00");
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    void logActivityUsaCaloriasInformadas() {
        when(userRepository.findById(USER_ID))
                .thenReturn(Optional.of(User.builder()
                        .id(USER_ID)
                        .tenantId(TENANT_ID)
                        .email("a@a.com")
                        .name("Ana")
                        .build()));
        when(activityLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var command = new LogActivityCommand(
                ActivityType.RUN,
                null,
                new BigDecimal("5.0"),
                new BigDecimal("320"),
                30,
                ActivitySource.STRAVA,
                "strava-1",
                null);

        ActivityLog saved = service.logActivity(USER_ID, command);

        assertThat(saved.getCaloriesBurned()).isEqualByComparingTo("320");
    }

    @Test
    void getSummarySomaCaloriasEPassos() {
        when(activityLogRepository.findByUserAndDate(eq(USER_ID), any()))
                .thenReturn(List.of(
                        ActivityLog.builder()
                                .caloriesBurned(new BigDecimal("400"))
                                .steps(10_000)
                                .build(),
                        ActivityLog.builder()
                                .caloriesBurned(new BigDecimal("120"))
                                .steps(3_000)
                                .build()));

        ActivitySummary summary = service.getSummary(USER_ID, LocalDate.now());

        assertThat(summary.totalCaloriesBurned()).isEqualTo(520);
        assertThat(summary.totalSteps()).isEqualTo(13_000);
        assertThat(summary.activityCount()).isEqualTo(2);
    }
}
