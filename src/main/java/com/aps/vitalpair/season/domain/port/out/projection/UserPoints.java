package com.aps.vitalpair.season.domain.port.out.projection;

import java.util.UUID;

/** A user's total points within the queried window. */
public record UserPoints(UUID userId, long points) {}
