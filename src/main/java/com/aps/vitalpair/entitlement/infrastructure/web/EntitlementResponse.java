package com.aps.vitalpair.entitlement.infrastructure.web;

import com.aps.vitalpair.entitlement.domain.port.in.AiEntitlementUseCase.Entitlement;
import com.aps.vitalpair.user.domain.model.Plan;

/**
 * @param plan the caller's own plan
 * @param aiAccess whether the AI features are open to the caller, through their plan or an
 *     active partner's; what the interface reads to show a feature or its paid-plan notice
 */
public record EntitlementResponse(Plan plan, boolean aiAccess) {

    static EntitlementResponse from(Entitlement entitlement) {
        return new EntitlementResponse(entitlement.plan(), entitlement.aiAccess());
    }
}
