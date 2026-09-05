package com.aps.vitalpair.mission.application.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionMetric;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionProgress;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionScope;
import com.aps.vitalpair.mission.domain.port.in.GetWeeklyMissionsUseCase;
import com.aps.vitalpair.mission.domain.port.out.WeeklyMissionCatalogRepositoryPort;
import com.aps.vitalpair.mission.domain.port.out.WeeklyMissionMetricsRepositoryPort;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class WeeklyMissionService implements GetWeeklyMissionsUseCase {

    private final WeeklyMissionCatalogRepositoryPort catalogRepository;
    private final WeeklyMissionMetricsRepositoryPort metricsRepository;
    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;

    public WeeklyMissionService(
            WeeklyMissionCatalogRepositoryPort catalogRepository,
            WeeklyMissionMetricsRepositoryPort metricsRepository,
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository) {
        this.catalogRepository = catalogRepository;
        this.metricsRepository = metricsRepository;
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyMissionProgress> getCurrentWeek(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        Instant weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay(zone)
                .toInstant();
        // Fim exclusivo: começo do dia seguinte a hoje, cobrindo o dia atual inteiro.
        Instant weekEnd = today.plusDays(1).atStartOfDay(zone).toInstant();

        User partner = findPartner(user, userId);

        List<WeeklyMissionProgress> result = new ArrayList<>();
        for (WeeklyMission mission : catalogRepository.findAllOrdered()) {
            int current = count(mission.getMetric(), userId, weekStart, weekEnd);

            if (mission.getScope() == WeeklyMissionScope.PAIR && partner != null) {
                int partnerCurrent = count(mission.getMetric(), partner.getId(), weekStart, weekEnd);
                boolean completed = current >= mission.getTarget() && partnerCurrent >= mission.getTarget();
                result.add(WeeklyMissionProgress.builder()
                        .mission(mission)
                        .current(current)
                        .partnerName(firstName(partner.getName()))
                        .partnerCurrent(partnerCurrent)
                        .completed(completed)
                        .build());
            } else if (mission.getScope() == WeeklyMissionScope.PAIR) {
                // Missão de dupla sem parceiro: não há como concluir.
                result.add(WeeklyMissionProgress.builder()
                        .mission(mission)
                        .current(current)
                        .partnerName(null)
                        .partnerCurrent(null)
                        .completed(false)
                        .build());
            } else {
                result.add(WeeklyMissionProgress.builder()
                        .mission(mission)
                        .current(current)
                        .partnerName(null)
                        .partnerCurrent(null)
                        .completed(current >= mission.getTarget())
                        .build());
            }
        }
        return result;
    }

    private int count(WeeklyMissionMetric metric, UUID userId, Instant start, Instant end) {
        return switch (metric) {
            case MEAL_DAYS -> metricsRepository.countMealDays(userId, start, end);
            case WORKOUTS -> metricsRepository.countWorkouts(userId, start, end);
        };
    }

    /** Resolve o outro membro do par, ou {@code null} se o usuário não tem parceiro. */
    private User findPartner(User user, UUID userId) {
        Pair pair = pairRepository.findById(user.getTenantId()).orElse(null);
        if (pair == null) {
            return null;
        }
        UUID partnerId = userId.equals(pair.getUser1Id()) ? pair.getUser2Id() : pair.getUser1Id();
        if (partnerId == null) {
            return null;
        }
        return userRepository.findById(partnerId).orElse(null);
    }

    private String firstName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return name.trim().split("\\s+")[0];
    }
}
