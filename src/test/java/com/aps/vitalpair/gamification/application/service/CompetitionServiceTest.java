package com.aps.vitalpair.gamification.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;
import com.aps.vitalpair.gamification.domain.port.out.CompetitionScoreRepositoryPort;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CompetitionServiceTest {

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID USER1 = UUID.randomUUID();
    private static final UUID USER2 = UUID.randomUUID();
    private static final LocalDate DATE = LocalDate.of(2026, 6, 21);

    @Mock
    private CompetitionScoreRepositoryPort competitionRepository;
    @Mock
    private PairRepositoryPort pairRepository;
    @Mock
    private UserRepositoryPort userRepository;
    @InjectMocks
    private CompetitionService service;

    @Test
    void addPointsCriaPlacarEDefineVencedor() {
        when(pairRepository.findById(TENANT)).thenReturn(Optional.of(pair()));
        when(competitionRepository.findByTenantAndWeek(eq(TENANT), any())).thenReturn(Optional.empty());
        when(competitionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.addPoints(TENANT, USER1, 10, DATE);

        ArgumentCaptor<CompetitionScore> captor = ArgumentCaptor.forClass(CompetitionScore.class);
        verify(competitionRepository).save(captor.capture());
        assertThat(captor.getValue().getUser1Score()).isEqualTo(10);
        assertThat(captor.getValue().getUser2Score()).isZero();
        assertThat(captor.getValue().getWinnerId()).isEqualTo(USER1);
    }

    @Test
    void addPointsAcumulaEViraOVencedor() {
        CompetitionScore existing = CompetitionScore.builder()
                .tenantId(TENANT).weekStart(DATE).user1Score(10).user2Score(5).build();
        when(pairRepository.findById(TENANT)).thenReturn(Optional.of(pair()));
        when(competitionRepository.findByTenantAndWeek(eq(TENANT), any())).thenReturn(Optional.of(existing));
        when(competitionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.addPoints(TENANT, USER2, 20, DATE);

        ArgumentCaptor<CompetitionScore> captor = ArgumentCaptor.forClass(CompetitionScore.class);
        verify(competitionRepository).save(captor.capture());
        assertThat(captor.getValue().getUser2Score()).isEqualTo(25);
        assertThat(captor.getValue().getWinnerId()).isEqualTo(USER2);
    }

    private Pair pair() {
        return Pair.builder().id(TENANT).user1Id(USER1).user2Id(USER2).build();
    }
}
