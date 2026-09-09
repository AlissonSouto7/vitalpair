package com.aps.vitalpair.user.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.shared.time.DayWindow;

/**
 * Where a user's day starts and ends.
 *
 * <p>Every feature that shows "today" has to agree on what today is, and the answer belongs to
 * the user, not to the server: the server's zone is an accident of where it is deployed. This
 * port exists so the question is asked once rather than each feature reaching for
 * {@code LocalDate.now()} and picking up whatever the JVM was started with.
 *
 * <p>The bug that produced it: a controller called {@code LocalDate.now()} in the JVM's zone
 * while the adapter turned that date into a window in UTC. In UTC-3 the two disagreed for the
 * last three hours of every day, and a meal logged at 21:35 saved with a 201 and then vanished
 * from the day's list.
 */
public interface UserDayUseCase {

    /** The date it currently is where this user is. */
    LocalDate today(UUID userId);

    /**
     * The half-open instant range covering that date in this user's zone.
     *
     * <p>Returned as a pair rather than two calls so both ends come from one reading of the
     * user's zone. Two calls could straddle a change to the preference and produce a window
     * that starts in one zone and ends in another.
     */
    DayWindow windowFor(UUID userId, LocalDate date);
}
