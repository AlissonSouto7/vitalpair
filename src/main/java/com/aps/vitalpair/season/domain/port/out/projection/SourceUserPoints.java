package com.aps.vitalpair.season.domain.port.out.projection;

import java.util.UUID;

import com.aps.vitalpair.season.domain.model.PointSource;

/** Pontos de um usuário em uma fonte específica. */
public record SourceUserPoints(PointSource source, UUID userId, long points) {}
