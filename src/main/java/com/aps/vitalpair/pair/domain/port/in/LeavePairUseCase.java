package com.aps.vitalpair.pair.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.pair.application.dto.PairView;

/** Ends an active pair, leaving both people free to start over with someone else. */
public interface LeavePairUseCase {

    /**
     * Ends the caller's pair.
     *
     * <p>Both people come out of it alone, each in a fresh pending tenant with an invite code
     * of their own, carrying what they personally recorded. What the two of them built
     * together, the seasons and the scores, stays behind with the pair that produced it: a
     * competition that happened does not stop having happened because it ended.
     *
     * @return the caller's new, empty pair
     * @throws com.aps.vitalpair.shared.exception.BusinessRuleException when there is no
     *     partner to leave
     */
    PairView leavePair(UUID userId);
}
