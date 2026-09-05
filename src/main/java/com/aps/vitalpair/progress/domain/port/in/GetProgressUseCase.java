package com.aps.vitalpair.progress.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.progress.domain.model.ProgressView;

/**
 * Caso de uso: montar a visão da tela de Progresso de um usuário
 * (histórico de peso, calorias dos últimos 7 dias e médias de macros).
 */
public interface GetProgressUseCase {

    ProgressView getProgress(UUID userId);
}
