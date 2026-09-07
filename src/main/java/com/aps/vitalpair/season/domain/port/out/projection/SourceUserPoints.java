package com.aps.vitalpair.season.domain.port.out.projection;

import java.util.UUID;

import com.aps.vitalpair.season.domain.model.PointSource;

/** A user's points from one source. */
public record SourceUserPoints(PointSource source, UUID userId, long points) {}
