package com.aps.vitalpair.user.infrastructure.web;

import jakarta.validation.constraints.NotNull;

import com.aps.vitalpair.user.domain.model.Mascot;

/**
 * A escolha do mascote.
 *
 * <p>Obrigatório: não existe "voltar a não ter escolhido". Nulo no banco quer dizer que a
 * pessoa nunca passou por aqui, e um PUT que gravasse nulo apagaria essa distinção.
 */
public record ChooseMascotRequest(@NotNull Mascot mascot) {}
