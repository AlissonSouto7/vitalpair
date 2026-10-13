package com.aps.vitalpair.season.domain.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.season.domain.model.Season;
import com.aps.vitalpair.season.domain.model.SeasonStatus;

/** Outbound port for persisting seasons. */
public interface SeasonRepositoryPort {

    Season save(Season season);

    /**
     * Grava e descarrega para o banco antes de seguir.
     *
     * <p>Existe por causa da virada de temporada. Fechar a atual e abrir a seguinte são duas
     * escritas na mesma transação, e o índice
     * {@code uq_seasons_active_per_tenant} garante uma só ACTIVE por par. Com o save comum, as
     * duas ficam na memória do Hibernate e descem juntas no fim, então por um instante existem
     * duas ACTIVE e o índice recusa: medido em 28/09/2026, ler a temporada no trigésimo dia
     * respondia 500 com
     * {@code duplicate key value violates unique constraint "uq_seasons_active_per_tenant"}.
     * Descarregar o fechamento primeiro faz o banco ver uma de cada vez.
     */
    Season saveAndFlush(Season season);

    Optional<Season> findActiveByTenant(UUID tenantId);

    /** Temporadas do tenant em um dado status, mais recentes primeiro (por number desc). */
    List<Season> findByTenantAndStatusOrderByNumberDesc(UUID tenantId, SeasonStatus status);
}
