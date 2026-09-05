package com.aps.vitalpair.gamification.application.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.gamification.application.dto.EarnedBadge;
import com.aps.vitalpair.gamification.domain.model.Badge;
import com.aps.vitalpair.gamification.domain.model.UserBadge;
import com.aps.vitalpair.gamification.domain.port.in.GetBadgeCatalogUseCase;
import com.aps.vitalpair.gamification.domain.port.in.GetUserBadgesUseCase;
import com.aps.vitalpair.gamification.domain.port.out.BadgeRepositoryPort;
import com.aps.vitalpair.gamification.domain.port.out.UserBadgeRepositoryPort;

@Service
public class BadgeService implements GetBadgeCatalogUseCase, GetUserBadgesUseCase {

    private final BadgeRepositoryPort badgeRepository;
    private final UserBadgeRepositoryPort userBadgeRepository;

    public BadgeService(BadgeRepositoryPort badgeRepository, UserBadgeRepositoryPort userBadgeRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Badge> getCatalog() {
        return badgeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EarnedBadge> getUserBadges(UUID userId) {
        Map<UUID, Badge> byId =
                badgeRepository.findAll().stream().collect(Collectors.toMap(Badge::getId, Function.identity()));
        return userBadgeRepository.findByUser(userId).stream()
                .map(earned -> new EarnedBadge(byId.get(earned.getBadgeId()), earned.getEarnedAt()))
                .filter(eb -> Objects.nonNull(eb.badge()))
                .toList();
    }

    /** Concede a conquista ao usuário se ainda não a tiver (idempotente). */
    @Transactional
    public void awardByCode(UUID userId, UUID tenantId, String code) {
        badgeRepository.findByCode(code).ifPresent(badge -> {
            if (!userBadgeRepository.existsByUserAndBadge(userId, badge.getId())) {
                userBadgeRepository.save(UserBadge.builder()
                        .tenantId(tenantId)
                        .userId(userId)
                        .badgeId(badge.getId())
                        .build());
            }
        });
    }
}
