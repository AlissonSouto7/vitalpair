package com.aps.vitalpair.mission.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public interface CompleteFlashMissionUseCase {

    /**
     * Marca a missão relâmpago de hoje como cumprida por esta pessoa, e paga a recompensa.
     *
     * <p>Declarado, não medido: o aplicativo não sabe quantos litros de água alguém bebeu.
     * Exige ter topado antes, e paga uma vez só por dia.
     */
    FlashMissionView completeToday(UUID userId);
}
