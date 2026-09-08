package com.aps.vitalpair.user.domain.port.in;

import java.util.UUID;

/** Closing an account: what belongs to the person goes, what describes a competition stays. */
public interface CloseAccountUseCase {

    /**
     * Closes the caller's account.
     *
     * <p>Their own records are deleted. The rows that describe a competition they took part
     * in are kept and stripped of identity instead: the season history is summed live from
     * the point ledger, so removing those rows would recompute every past season with a
     * rival score of zero and hand the partner wins they did not earn. Article 12 of the
     * LGPD treats anonymised data as no longer personal, which is what makes keeping it
     * lawful and the partner's history honest at the same time.
     *
     * <p>The user row survives as a tombstone with its e-mail freed, so the person can sign
     * up again with the same address.
     */
    void closeAccount(UUID userId);
}
