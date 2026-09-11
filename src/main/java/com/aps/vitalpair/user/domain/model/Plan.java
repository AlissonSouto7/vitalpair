package com.aps.vitalpair.user.domain.model;

/**
 * What a person pays for.
 *
 * <p>Deliberately two values. FREE is everyone; PREMIUM is who pays and, while their pair is
 * active, the partner as well. The AI features are the whole difference between the two
 * today. Tiers finer than this would be guessing at a pricing that does not exist yet.
 */
public enum Plan {
    FREE,
    PREMIUM
}
