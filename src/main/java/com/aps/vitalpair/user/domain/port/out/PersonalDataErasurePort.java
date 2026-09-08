package com.aps.vitalpair.user.domain.port.out;

import java.util.UUID;

/**
 * Erases the rows one person recorded about themselves.
 *
 * <p>Deliberately not every row carrying their user id. Four tables are left alone, and the
 * distinction is the whole design: a meal is a fact about one person, while a point award,
 * a weekly score, a season result and a badge are facts about a competition between two.
 * The season history is summed from {@code point_events} on every read, so deleting the
 * departing person's rows would not remove a record, it would rewrite the partner's: every
 * past season recomputed with a rival score of zero, and every season the partner lost
 * turned into a win. Those four keep their rows and lose their identity instead, which
 * article 12 of the LGPD accepts, because anonymised data is no longer personal data.
 */
public interface PersonalDataErasurePort {

    /**
     * Deletes what the person recorded about themselves.
     *
     * @return how many rows were deleted, for the log line that records what happened
     */
    int erasePersonalRecords(UUID userId);
}
