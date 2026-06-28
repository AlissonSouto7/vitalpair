package com.aps.vitalpair.progress.domain.port.in;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Caso de uso: registrar o peso de HOJE de um usuário (upsert por dia). Chamado
 * pelo endpoint de progresso e também pela feature {@code user} quando o peso do
 * perfil é atualizado, para virar um ponto do histórico sem ciclo de dependência.
 */
public interface RecordWeightUseCase {

    /**
     * Registra/atualiza o peso de hoje do usuário.
     *
     * @param userId   usuário
     * @param weightKg peso em quilos
     */
    void recordTodayWeight(UUID userId, BigDecimal weightKg);
}
