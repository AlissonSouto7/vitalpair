package com.aps.vitalpair.season.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.season.application.dto.SeasonView;

/** Edita a aposta da temporada ativa do usuário e devolve a visão atualizada. */
public interface UpdateStakeUseCase {

    SeasonView updateStake(UUID userId, String stake);
}
