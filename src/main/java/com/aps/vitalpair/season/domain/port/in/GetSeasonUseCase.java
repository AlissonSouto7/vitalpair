package com.aps.vitalpair.season.domain.port.in;

import com.aps.vitalpair.season.application.dto.SeasonView;
import java.util.UUID;

/** Garante a temporada atual do usuário e devolve a visão completa para o frontend. */
public interface GetSeasonUseCase {

    SeasonView getCurrentSeason(UUID userId);
}
