package com.aps.vitalpair.user.domain.model;

import java.time.DateTimeException;
import java.time.ZoneId;

/**
 * The zone a user's day is measured in.
 *
 * <p>One place decides what counts as a valid zone, because the answer is needed at three
 * different edges: the request that changes the preference, the row that is read back, and the
 * account being created. Three copies of {@code ZoneId.of} in a try/catch would drift.
 */
public final class UserTimeZones {

    /**
     * Used when a stored zone cannot be resolved and when none was chosen.
     *
     * <p>Brazil, because that is where the product's users are. It is a default, not an
     * assumption baked into the code: everything that asks about a user's day reads their own
     * zone, so a user elsewhere is a preference change, not a code change.
     */
    public static final ZoneId FALLBACK = ZoneId.of("America/Sao_Paulo");

    private UserTimeZones() {}

    /** Whether the JVM's time zone database recognises this identifier. */
    public static boolean isValid(String zone) {
        if (zone == null || zone.isBlank()) {
            return false;
        }
        try {
            ZoneId.of(zone);
            return true;
        } catch (DateTimeException e) {
            return false;
        }
    }
}
