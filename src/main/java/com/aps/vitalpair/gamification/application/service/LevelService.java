package com.aps.vitalpair.gamification.application.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.gamification.domain.model.Level;
import com.aps.vitalpair.gamification.domain.port.in.GetLevelUseCase;
import com.aps.vitalpair.season.domain.port.out.PointEventRepositoryPort;

/** Ver {@link GetLevelUseCase}. */
@Service
public class LevelService implements GetLevelUseCase {

    private final PointEventRepositoryPort pointEvents;

    public LevelService(PointEventRepositoryPort pointEvents) {
        this.pointEvents = pointEvents;
    }

    @Override
    @Transactional(readOnly = true)
    public Level getLevel(UUID userId) {
        /*
         * Somado na hora, e não guardado numa coluna.
         *
         * Uma coluna seria um segundo lugar dizendo a mesma coisa que o ledger, e os dois
         * divergiriam no primeiro ponto concedido por um caminho que esquecesse de atualizá-la.
         * O ledger é append-only e já tem índice por usuário; se um dia a soma pesar, a conta
         * vira uma coluna alimentada por este mesmo ponto.
         */
        return Level.of(pointEvents.sumLifetime(userId));
    }
}
