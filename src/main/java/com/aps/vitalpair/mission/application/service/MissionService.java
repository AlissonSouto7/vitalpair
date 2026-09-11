package com.aps.vitalpair.mission.application.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;
import com.aps.vitalpair.mission.domain.model.Mission;
import com.aps.vitalpair.mission.domain.model.MissionKind;
import com.aps.vitalpair.mission.domain.model.PairMissionState;
import com.aps.vitalpair.mission.domain.port.in.AcceptFlashMissionUseCase;
import com.aps.vitalpair.mission.domain.port.in.GetFlashMissionUseCase;
import com.aps.vitalpair.mission.domain.port.out.MissionCatalogRepositoryPort;
import com.aps.vitalpair.mission.domain.port.out.PairMissionRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class MissionService implements GetFlashMissionUseCase, AcceptFlashMissionUseCase {

    private final MissionCatalogRepositoryPort catalogRepository;
    private final PairMissionRepositoryPort pairMissionRepository;
    private final UserRepositoryPort userRepository;

    /**
     * Which day the flash mission belongs to, and when it expires.
     *
     * <p>Was {@code LocalDate.now()} with no zone at all, which is the JVM's default: the same
     * mismatch as S-7, one feature over. A mission chosen by day of the year changes at
     * midnight somewhere, and that somewhere has to be the product's zone rather than
     * whatever the machine was configured with.
     */
    private final Clock clock;

    public MissionService(
            MissionCatalogRepositoryPort catalogRepository,
            PairMissionRepositoryPort pairMissionRepository,
            UserRepositoryPort userRepository,
            Clock clock,
            @Value("${vitalpair.scheduling.zone}") String zone) {
        this.catalogRepository = catalogRepository;
        this.pairMissionRepository = pairMissionRepository;
        this.userRepository = userRepository;
        this.clock = clock.withZone(ZoneId.of(zone));
    }

    @Override
    @Transactional(readOnly = true)
    public FlashMissionView getToday(UUID userId) {
        UUID tenantId = resolveTenant(userId);
        LocalDate today = LocalDate.now(clock);
        Mission mission = missionOfDay(today);
        boolean accepted = pairMissionRepository
                .find(tenantId, today)
                .map(PairMissionState::isAccepted)
                .orElse(false);
        return view(mission, today, accepted);
    }

    @Override
    @Transactional
    public FlashMissionView acceptToday(UUID userId) {
        UUID tenantId = resolveTenant(userId);
        LocalDate today = LocalDate.now(clock);
        Mission mission = missionOfDay(today);

        PairMissionState state = pairMissionRepository
                .find(tenantId, today)
                .map(existing -> existing.toBuilder()
                        .accepted(true)
                        .acceptedAt(clock.instant())
                        .build())
                .orElseGet(() -> PairMissionState.builder()
                        .tenantId(tenantId)
                        .missionCode(mission.getCode())
                        .date(today)
                        .accepted(true)
                        .acceptedAt(clock.instant())
                        .build());

        PairMissionState saved = pairMissionRepository.save(state);
        return view(mission, today, saved.isAccepted());
    }

    private UUID resolveTenant(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        return user.getTenantId();
    }

    /** Picks a FLASH mission deterministically from the day of the year. */
    private Mission missionOfDay(LocalDate date) {
        List<Mission> flash = catalogRepository.findByKind(MissionKind.FLASH);
        if (flash.isEmpty()) {
            throw ResourceNotFoundException.of("Missão relâmpago", MissionKind.FLASH);
        }
        int index = (date.getDayOfYear() - 1) % flash.size();
        return flash.get(index);
    }

    private FlashMissionView view(Mission mission, LocalDate date, boolean accepted) {
        Instant expiresAt =
                date.atTime(LocalTime.of(23, 59, 59)).atZone(clock.getZone()).toInstant();
        return FlashMissionView.builder()
                .mission(mission)
                .date(date)
                .accepted(accepted)
                .expiresAt(expiresAt)
                .build();
    }
}
