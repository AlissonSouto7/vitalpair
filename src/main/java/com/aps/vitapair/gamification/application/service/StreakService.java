package com.aps.vitapair.gamification.application.service;

import com.aps.vitapair.gamification.domain.model.StreakType;
import com.aps.vitapair.gamification.domain.model.UserStreak;
import com.aps.vitapair.gamification.domain.port.in.GetStreaksUseCase;
import com.aps.vitapair.gamification.domain.port.out.UserStreakRepositoryPort;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StreakService implements GetStreaksUseCase {

    private final UserStreakRepositoryPort streakRepository;

    public StreakService(UserStreakRepositoryPort streakRepository) {
        this.streakRepository = streakRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserStreak> getStreaks(UUID userId) {
        return streakRepository.findByUser(userId);
    }

    /**
     * Registra atividade do dia para o tipo. Retorna a streak atualizada apenas quando é o primeiro
     * registro do dia (avançou/criou/reiniciou); vazio quando já contou hoje ou a data é anterior.
     */
    @Transactional
    public Optional<UserStreak> registerActivity(UUID userId, UUID tenantId, StreakType type, LocalDate date) {
        UserStreak existing = streakRepository.findByUserAndType(userId, type).orElse(null);

        if (existing == null) {
            return Optional.of(streakRepository.save(UserStreak.builder()
                    .tenantId(tenantId).userId(userId).type(type)
                    .currentCount(1).longestCount(1).lastActivityDate(date)
                    .build()));
        }

        LocalDate last = existing.getLastActivityDate();
        if (last != null && !date.isAfter(last)) {
            return Optional.empty(); // mesmo dia (já contou) ou data anterior
        }

        int current = (last != null && last.equals(date.minusDays(1))) ? existing.getCurrentCount() + 1 : 1;
        int longest = Math.max(existing.getLongestCount(), current);

        return Optional.of(streakRepository.save(existing.toBuilder()
                .currentCount(current).longestCount(longest).lastActivityDate(date)
                .build()));
    }
}
