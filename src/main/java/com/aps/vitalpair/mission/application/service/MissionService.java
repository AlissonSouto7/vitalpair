package com.aps.vitalpair.mission.application.service;

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
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MissionService implements GetFlashMissionUseCase, AcceptFlashMissionUseCase {

    private final MissionCatalogRepositoryPort catalogRepository;
    private final PairMissionRepositoryPort pairMissionRepository;
    private final UserRepositoryPort userRepository;

    public MissionService(
            MissionCatalogRepositoryPort catalogRepository,
            PairMissionRepositoryPort pairMissionRepository,
            UserRepositoryPort userRepository) {
        this.catalogRepository = catalogRepository;
        this.pairMissionRepository = pairMissionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FlashMissionView getToday(UUID userId) {
        UUID tenantId = resolveTenant(userId);
        LocalDate today = LocalDate.now();
        Mission mission = missionOfDay(today);
        boolean accepted = pairMissionRepository.find(tenantId, today)
                .map(PairMissionState::isAccepted)
                .orElse(false);
        return view(mission, today, accepted);
    }

    @Override
    @Transactional
    public FlashMissionView acceptToday(UUID userId) {
        UUID tenantId = resolveTenant(userId);
        LocalDate today = LocalDate.now();
        Mission mission = missionOfDay(today);

        PairMissionState state = pairMissionRepository.find(tenantId, today)
                .map(existing -> existing.toBuilder()
                        .accepted(true)
                        .acceptedAt(Instant.now())
                        .build())
                .orElseGet(() -> PairMissionState.builder()
                        .tenantId(tenantId)
                        .missionCode(mission.getCode())
                        .date(today)
                        .accepted(true)
                        .acceptedAt(Instant.now())
                        .build());

        PairMissionState saved = pairMissionRepository.save(state);
        return view(mission, today, saved.isAccepted());
    }

    private UUID resolveTenant(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        return user.getTenantId();
    }

    /** Escolhe uma missão FLASH de forma determinística pelo dia do ano. */
    private Mission missionOfDay(LocalDate date) {
        List<Mission> flash = catalogRepository.findByKind(MissionKind.FLASH);
        if (flash.isEmpty()) {
            throw ResourceNotFoundException.of("Missão relâmpago", MissionKind.FLASH);
        }
        int index = (date.getDayOfYear() - 1) % flash.size();
        return flash.get(index);
    }

    private FlashMissionView view(Mission mission, LocalDate date, boolean accepted) {
        Instant expiresAt = date.atTime(LocalTime.of(23, 59, 59))
                .atZone(ZoneId.systemDefault())
                .toInstant();
        return FlashMissionView.builder()
                .mission(mission)
                .date(date)
                .accepted(accepted)
                .expiresAt(expiresAt)
                .build();
    }
}
