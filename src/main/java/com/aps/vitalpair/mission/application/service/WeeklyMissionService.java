package com.aps.vitalpair.mission.application.service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    private static final Logger log = LoggerFactory.getLogger(WeeklyMissionService.class);

    private final WeeklyMissionCatalogRepositoryPort catalogRepository;
    private final WeeklyMissionMetricsRepositoryPort metricsRepository;
    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;
    private final MissionRewardService rewardService;

    /**
     * Where the mission week starts and ends.
     *
     * <p>The product's zone, which is what this read before as {@code ZoneId.systemDefault()}.
     * A weekly mission belongs to a pair rather than to one person, and two people can be in
     * different zones, so whose Monday counts is a product question this does not answer: it
     * is recorded as debt in {@code docs/features/missions.md} instead of being decided here.
     */
    private final Clock clock;

    public WeeklyMissionService(
            WeeklyMissionCatalogRepositoryPort catalogRepository,
            WeeklyMissionMetricsRepositoryPort metricsRepository,
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository,
            MissionRewardService rewardService,
            Clock clock,
            @Value("${vitalpair.scheduling.zone}") String zone) {
        this.catalogRepository = catalogRepository;
        this.metricsRepository = metricsRepository;
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
        this.rewardService = rewardService;
        this.clock = clock.withZone(ZoneId.of(zone));
    }

    /**
     * O progresso da semana, pagando o que tiver ficado pronto.
     *
     * <p>Não é `readOnly`: as missões semanais não guardam progresso, ele é contado dos
     * registros reais a cada leitura, então não existe um instante de "acabou de completar"
     * para escutar. A leitura é o único momento em que dá para saber, e por isso é aqui que a
     * recompensa é paga. Pagar duas vezes é impedido pela chave única da tabela de
     * recompensas, não por esta ordem de chamadas.
     */
    @Override
    @Transactional
    public List<WeeklyMissionProgress> getCurrentWeek(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        ZoneId zone = clock.getZone();
        LocalDate today = LocalDate.now(clock);
        Instant weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay(zone)
                .toInstant();
        // Exclusive end: the start of tomorrow, so the whole of today is covered.
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
                // A pair mission with no partner: there is nobody to do the other half.
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

        awardCompleted(user.getTenantId(), userId, today, result);
        return result;
    }

    /**
     * Paga o que está completo e ainda não foi pago.
     *
     * <p>A chave do período é a segunda-feira da semana: cumprir de novo na semana seguinte é
     * uma recompensa nova, abrir a tela dez vezes na mesma semana não é.
     *
     * <p>Uma falha aqui não pode custar a leitura da tela à pessoa. A missão continua
     * completa, e a próxima leitura tenta pagar de novo, porque a trava é o que já foi pago e
     * não o fato de já se ter tentado.
     */
    private void awardCompleted(UUID tenantId, UUID userId, LocalDate today, List<WeeklyMissionProgress> progresso) {
        LocalDate semana = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        for (WeeklyMissionProgress p : progresso) {
            if (!p.isCompleted()) {
                continue;
            }
            try {
                rewardService.awardIfNew(
                        tenantId,
                        userId,
                        p.getMission().getCode(),
                        semana,
                        p.getMission().getReward());
            } catch (RuntimeException e) {
                log.warn(
                        "Não foi possível pagar a recompensa da missão {} para {}",
                        p.getMission().getCode(),
                        userId,
                        e);
            }
        }
    }

    private int count(WeeklyMissionMetric metric, UUID userId, Instant start, Instant end) {
        return switch (metric) {
            case MEAL_DAYS -> metricsRepository.countMealDays(userId, start, end);
            case WORKOUTS -> metricsRepository.countWorkouts(userId, start, end);
        };
    }

    /** Resolves the other member of the pair, or {@code null} when the user has no partner. */
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
