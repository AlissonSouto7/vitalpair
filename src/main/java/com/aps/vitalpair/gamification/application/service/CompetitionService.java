package com.aps.vitalpair.gamification.application.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;
import com.aps.vitalpair.gamification.domain.port.in.GetCompetitionUseCase;
import com.aps.vitalpair.gamification.domain.port.out.CompetitionScoreRepositoryPort;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class CompetitionService implements GetCompetitionUseCase {

    private final CompetitionScoreRepositoryPort competitionRepository;
    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;

    public CompetitionService(
            CompetitionScoreRepositoryPort competitionRepository,
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository) {
        this.competitionRepository = competitionRepository;
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CompetitionScore getCurrentCompetition(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        LocalDate week = weekStart(LocalDate.now());
        return competitionRepository
                .findByTenantAndWeek(user.getTenantId(), week)
                .orElseGet(() -> emptyScore(user.getTenantId(), week));
    }

    @Transactional
    public void addPoints(UUID tenantId, UUID userId, int points, LocalDate date) {
        Pair pair = pairRepository.findById(tenantId).orElse(null);
        if (pair == null) {
            return;
        }
        LocalDate week = weekStart(date);
        CompetitionScore score =
                competitionRepository.findByTenantAndWeek(tenantId, week).orElseGet(() -> emptyScore(tenantId, week));

        int user1Score = score.getUser1Score();
        int user2Score = score.getUser2Score();
        if (userId.equals(pair.getUser1Id())) {
            user1Score += points;
        } else if (userId.equals(pair.getUser2Id())) {
            user2Score += points;
        } else {
            return;
        }

        UUID winner =
                user1Score > user2Score ? pair.getUser1Id() : (user2Score > user1Score ? pair.getUser2Id() : null);

        competitionRepository.save(score.toBuilder()
                .user1Score(user1Score)
                .user2Score(user2Score)
                .winnerId(winner)
                .build());
    }

    /** Pontuação atual do usuário na semana da data informada (0 se ainda não pontuou). */
    @Transactional(readOnly = true)
    public int currentScoreOf(UUID tenantId, UUID userId, LocalDate date) {
        Pair pair = pairRepository.findById(tenantId).orElse(null);
        if (pair == null) {
            return 0;
        }
        CompetitionScore score = competitionRepository
                .findByTenantAndWeek(tenantId, weekStart(date))
                .orElse(null);
        if (score == null) {
            return 0;
        }
        if (userId.equals(pair.getUser1Id())) {
            return score.getUser1Score();
        }
        if (userId.equals(pair.getUser2Id())) {
            return score.getUser2Score();
        }
        return 0;
    }

    /** Parceiro do usuário no par (null se não houver par ou parceiro). */
    @Transactional(readOnly = true)
    public UUID partnerOf(UUID tenantId, UUID userId) {
        Pair pair = pairRepository.findById(tenantId).orElse(null);
        if (pair == null) {
            return null;
        }
        if (userId.equals(pair.getUser1Id())) {
            return pair.getUser2Id();
        }
        if (userId.equals(pair.getUser2Id())) {
            return pair.getUser1Id();
        }
        return null;
    }

    private CompetitionScore emptyScore(UUID tenantId, LocalDate week) {
        return CompetitionScore.builder()
                .tenantId(tenantId)
                .weekStart(week)
                .user1Score(0)
                .user2Score(0)
                .build();
    }

    private LocalDate weekStart(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
