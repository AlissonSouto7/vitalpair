package com.aps.vitalpair.gamification.application.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.gamification.domain.model.UserStreak;
import com.aps.vitalpair.gamification.domain.port.in.GetStreaksUseCase;
import com.aps.vitalpair.gamification.domain.port.out.UserStreakRepositoryPort;

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
     * Records the day's activity for the type. Returns the updated streak only when this is the
     * day's first record (advanced, created or restarted); empty when today already counted or the
     * date is earlier.
     */
    @Transactional
    public Optional<UserStreak> registerActivity(UUID userId, UUID tenantId, StreakType type, LocalDate date) {
        UserStreak existing = streakRepository.findByUserAndType(userId, type).orElse(null);

        if (existing == null) {
            return Optional.of(streakRepository.save(UserStreak.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .type(type)
                    .currentCount(1)
                    .longestCount(1)
                    .lastActivityDate(date)
                    .build()));
        }

        LocalDate last = existing.getLastActivityDate();
        if (last != null && !date.isAfter(last)) {
            // Same day (already counted) or an older one. Empty is how this tells the caller
            // not to award anything: logging a second meal today is not a second day.
            return Optional.empty();
        }

        int current = (last != null && last.equals(date.minusDays(1))) ? existing.getCurrentCount() + 1 : 1;
        int longest = Math.max(existing.getLongestCount(), current);

        return Optional.of(streakRepository.save(existing.toBuilder()
                .currentCount(current)
                .longestCount(longest)
                .lastActivityDate(date)
                .build()));
    }
}
