package com.aps.vitalpair.admin.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.GrantPlanUseCase;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Conceder e retirar o plano pago.
 *
 * <p>Separado do {@link AdminStatsController} de propósito: aquele diz, no seu próprio
 * texto, que só devolve contagens e nunca dado de outra pessoa, e é isso que torna a
 * afirmação verificável. Um endereço que escreve no plano de terceiro não cabe lá dentro
 * sem transformar essa garantia em mentira.
 *
 * <p>Antes disso, virar PREMIUM era um UPDATE escrito à mão no banco de produção: exigia
 * SSH, não deixava rastro de quem concedeu, e tinha de ser repetido a cada conta nova.
 */
@Tag(name = "Admin", description = "Plan administration. Requires the ADMIN role.")
@RestController
@RequestMapping("/api/v1/admin/plans")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPlanController {

    private final GrantPlanUseCase grantPlanUseCase;

    public AdminPlanController(GrantPlanUseCase grantPlanUseCase) {
        this.grantPlanUseCase = grantPlanUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Grant or remove the paid plan",
            description =
                    "Writes the plan of the account with the given e-mail. PREMIUM with no expiry is a plan without an end date, which is what the test accounts have; FREE removes the access and clears any expiry. This is the administrative path, for courtesy, support and testing: once billing exists, a confirmed payment is what writes a subscription. Requires the ADMIN role, which is granted by a database update and never through the API.")
    @PutMapping
    public ResponseEntity<ApiResponse<AdminPlanResponse>> grant(@Valid @RequestBody GrantPlanRequest request) {
        User user = grantPlanUseCase.grantPlan(request.email(), request.plan(), request.expiresAt());
        return ResponseEntity.ok(ApiResponse.ok(AdminPlanResponse.from(user), "Plano atualizado"));
    }
}
