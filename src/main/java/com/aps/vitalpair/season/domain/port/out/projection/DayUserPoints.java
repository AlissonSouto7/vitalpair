package com.aps.vitalpair.season.domain.port.out.projection;

import java.time.LocalDate;
import java.util.UUID;

/** A user's points on one day. */
public record DayUserPoints(LocalDate day, UUID userId, long points) {}
