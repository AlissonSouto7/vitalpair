package com.aps.vitalpair.gamification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.Level;

/**
 * Em que nível a pessoa está.
 *
 * <p>Somado do ledger, e não da temporada: o nível é o esforço acumulado de quem usa, então
 * não pode zerar quando uma temporada fecha nem quando alguém troca de dupla.
 */
public interface GetLevelUseCase {

    Level getLevel(UUID userId);
}
