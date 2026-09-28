package com.aps.vitalpair.admin.infrastructure.web;

import java.time.Instant;

import com.aps.vitalpair.user.domain.model.Plan;
import com.aps.vitalpair.user.domain.model.User;

/**
 * Como a conta ficou depois da mudança.
 *
 * <p>Só o plano e o e-mail que identificou a conta. Um endereço de administração que
 * devolvesse o perfil inteiro daria a um ADMIN uma forma de ler dado de qualquer pessoa
 * passando por uma operação de escrita, que não é o que ele existe para fazer.
 */
public record AdminPlanResponse(String email, Plan plan, Instant expiresAt) {

    public static AdminPlanResponse from(User user) {
        return new AdminPlanResponse(user.getEmail(), user.getPlan(), user.getPlanExpiresAt());
    }
}
