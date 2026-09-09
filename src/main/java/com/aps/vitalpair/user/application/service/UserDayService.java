package com.aps.vitalpair.user.application.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.shared.time.DayWindow;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.model.UserTimeZones;
import com.aps.vitalpair.user.domain.port.in.UserDayUseCase;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/** Answers what "today" means for one user. See {@link UserDayUseCase} for why it exists. */
@Service
public class UserDayService implements UserDayUseCase {

    private final UserRepositoryPort userRepository;

    public UserDayService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public LocalDate today(UUID userId) {
        return LocalDate.now(zoneOf(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public DayWindow windowFor(UUID userId, LocalDate date) {
        return DayWindow.of(date, zoneOf(userId));
    }

    /**
     * A user who cannot be found gets the fallback rather than an exception.
     *
     * <p>This is only ever reached with the id of an already authenticated caller, so a miss
     * means the account was closed mid-request. Failing here would turn that into a 404 from
     * whichever screen happened to ask about the date, which is a worse answer than the
     * default zone; the caller's own lookup reports the real problem.
     */
    private ZoneId zoneOf(UUID userId) {
        return userRepository.findById(userId).map(User::zone).orElse(UserTimeZones.FALLBACK);
    }
}
