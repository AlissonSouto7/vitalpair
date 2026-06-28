package com.aps.vitalpair.gamification.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.gamification.domain.model.UserStreak;
import com.aps.vitalpair.gamification.domain.port.out.UserStreakRepositoryPort;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 6, 21);

    @Mock
    private UserStreakRepositoryPort repository;
    @InjectMocks
    private StreakService service;

    @Test
    void criaStreakQuandoNaoExiste() {
        when(repository.findByUserAndType(USER, StreakType.NUTRITION_LOG)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        Optional<UserStreak> result = service.registerActivity(USER, TENANT, StreakType.NUTRITION_LOG, TODAY);

        assertThat(result).isPresent();
        assertThat(result.get().getCurrentCount()).isEqualTo(1);
        assertThat(result.get().getLongestCount()).isEqualTo(1);
    }

    @Test
    void incrementaEmDiasConsecutivos() {
        UserStreak existing = streak(3, 3, TODAY.minusDays(1));
        when(repository.findByUserAndType(USER, StreakType.NUTRITION_LOG)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        Optional<UserStreak> result = service.registerActivity(USER, TENANT, StreakType.NUTRITION_LOG, TODAY);

        assertThat(result.get().getCurrentCount()).isEqualTo(4);
        assertThat(result.get().getLongestCount()).isEqualTo(4);
    }

    @Test
    void reiniciaComLacunaMantendoMaiorSequencia() {
        UserStreak existing = streak(5, 5, TODAY.minusDays(3));
        when(repository.findByUserAndType(USER, StreakType.NUTRITION_LOG)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        Optional<UserStreak> result = service.registerActivity(USER, TENANT, StreakType.NUTRITION_LOG, TODAY);

        assertThat(result.get().getCurrentCount()).isEqualTo(1);
        assertThat(result.get().getLongestCount()).isEqualTo(5);
    }

    @Test
    void naoContaDuasVezesNoMesmoDia() {
        UserStreak existing = streak(2, 2, TODAY);
        when(repository.findByUserAndType(USER, StreakType.NUTRITION_LOG)).thenReturn(Optional.of(existing));

        Optional<UserStreak> result = service.registerActivity(USER, TENANT, StreakType.NUTRITION_LOG, TODAY);

        assertThat(result).isEmpty();
        verify(repository, never()).save(any());
    }

    private UserStreak streak(int current, int longest, LocalDate last) {
        return UserStreak.builder()
                .userId(USER).tenantId(TENANT).type(StreakType.NUTRITION_LOG)
                .currentCount(current).longestCount(longest).lastActivityDate(last)
                .build();
    }
}
