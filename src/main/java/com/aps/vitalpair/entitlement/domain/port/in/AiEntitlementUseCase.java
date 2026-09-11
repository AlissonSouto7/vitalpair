package com.aps.vitalpair.entitlement.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.entitlement.domain.exception.AiAccessRequiredException;
import com.aps.vitalpair.user.domain.model.Plan;

/**
 * Whether a person may use the AI features, and why.
 *
 * <p>The rule: a person has access when their own plan is PREMIUM and not expired, or when
 * their pair is active and the partner's is. The plan belongs to whoever paid and follows
 * them out of a pair; the partner only borrows it for as long as the pair lasts.
 */
public interface AiEntitlementUseCase {

    /** The person's own plan and whether they may use the AI features right now. */
    Entitlement entitlementOf(UUID userId);

    /**
     * Refuses the caller when they may not use the AI features.
     *
     * <p>Called first by every use case that would otherwise reach the model, before any
     * validation and before any paid call: a person without the plan should hear about the
     * plan, not about a missing calorie target.
     *
     * @throws AiAccessRequiredException when neither the person nor an active partner pays
     */
    void requireAiAccess(UUID userId);

    /**
     * @param plan the person's own plan, not the borrowed one
     * @param aiAccess whether the AI features are open to them, own plan or partner's
     */
    record Entitlement(Plan plan, boolean aiAccess) {}
}
