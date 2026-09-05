package com.aps.vitalpair.season.domain.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.season.domain.model.Season;
import com.aps.vitalpair.season.domain.model.SeasonStatus;

/** Porta de saída para persistência de temporadas. */
public interface SeasonRepositoryPort {

    Season save(Season season);

    Optional<Season> findActiveByTenant(UUID tenantId);

    /** Temporadas do tenant em um dado status, mais recentes primeiro (por number desc). */
    List<Season> findByTenantAndStatusOrderByNumberDesc(UUID tenantId, SeasonStatus status);
}
