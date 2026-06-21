package com.aps.vitapair.gamification.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aps.vitapair.gamification.application.dto.EarnedBadge;
import com.aps.vitapair.gamification.domain.model.Badge;
import com.aps.vitapair.gamification.domain.model.BadgeCategory;
import com.aps.vitapair.gamification.domain.model.UserBadge;
import com.aps.vitapair.gamification.domain.port.out.BadgeRepositoryPort;
import com.aps.vitapair.gamification.domain.port.out.UserBadgeRepositoryPort;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID BADGE_ID = UUID.randomUUID();

    @Mock
    private BadgeRepositoryPort badgeRepository;
    @Mock
    private UserBadgeRepositoryPort userBadgeRepository;
    @InjectMocks
    private BadgeService service;

    @Test
    void awardConcedeQuandoAindaNaoTem() {
        when(badgeRepository.findByCode("FIRST_MEAL")).thenReturn(Optional.of(badge()));
        when(userBadgeRepository.existsByUserAndBadge(USER, BADGE_ID)).thenReturn(false);

        service.awardByCode(USER, TENANT, "FIRST_MEAL");

        verify(userBadgeRepository).save(any());
    }

    @Test
    void awardNaoDuplicaQuandoJaTem() {
        when(badgeRepository.findByCode("FIRST_MEAL")).thenReturn(Optional.of(badge()));
        when(userBadgeRepository.existsByUserAndBadge(USER, BADGE_ID)).thenReturn(true);

        service.awardByCode(USER, TENANT, "FIRST_MEAL");

        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void awardIgnoraCodigoDesconhecido() {
        when(badgeRepository.findByCode("XXX")).thenReturn(Optional.empty());

        service.awardByCode(USER, TENANT, "XXX");

        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void getUserBadgesJuntaDetalhesDoCatalogo() {
        when(badgeRepository.findAll()).thenReturn(List.of(badge()));
        when(userBadgeRepository.findByUser(USER)).thenReturn(List.of(
                UserBadge.builder().userId(USER).tenantId(TENANT).badgeId(BADGE_ID).earnedAt(Instant.now()).build()));

        List<EarnedBadge> result = service.getUserBadges(USER);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).badge().getName()).isEqualTo("Primeira refeição");
    }

    private Badge badge() {
        return Badge.builder()
                .id(BADGE_ID).code("FIRST_MEAL").name("Primeira refeição")
                .description("Registrou a primeira refeição").icon("fa-utensils")
                .category(BadgeCategory.NUTRITION)
                .build();
    }
}
