package com.aps.vitalpair.admin.infrastructure.web;

import java.time.Instant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.aps.vitalpair.user.domain.model.Plan;

/**
 * Quem recebe o plano, e qual.
 *
 * @param email a conta alvo, pelo endereço com que ela se cadastrou
 * @param plan PREMIUM concede, FREE retira
 * @param expiresAt quando acaba, ou null para um plano sem prazo. {@code @Future} do próprio
 *     Bean Validation, e não o {@code @NotInFuture} deste projeto ao contrário: aquele carrega
 *     uma tolerância de dois minutos para o relógio do celular de quem registra uma refeição, e
 *     aqui a data é escolhida por uma pessoa, sem relógio de cliente no caminho. Conceder um
 *     plano já vencido é pedido sem sentido, quase sempre erro de digitação, então é recusado.
 */
public record GrantPlanRequest(
        @NotBlank @Email @Size(max = 255) String email, @NotNull Plan plan, @Future Instant expiresAt) {}
