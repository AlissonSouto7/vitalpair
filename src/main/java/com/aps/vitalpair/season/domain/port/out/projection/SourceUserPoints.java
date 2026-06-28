package com.aps.vitalpair.season.domain.port.out.projection;

import com.aps.vitalpair.season.domain.model.PointSource;
import java.util.UUID;

/** Pontos de um usuário em uma fonte específica. */
public record SourceUserPoints(PointSource source, UUID userId, long points) {
}
