package com.aps.vitalpair.season.domain.port.out;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.season.domain.model.PointEvent;
import com.aps.vitalpair.season.domain.port.out.projection.DayUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.SourceUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.UserPoints;

/** Outbound port to the points ledger ({@code point_events}). */
public interface PointEventRepositoryPort {

    PointEvent save(PointEvent event);

    /** Points summed per user within [start, end). */
    List<UserPoints> sumByUser(UUID tenantId, Instant start, Instant end);

    /** Points summed per day and user within [start, end). */
    List<DayUserPoints> sumByDayAndUser(UUID tenantId, Instant start, Instant end);

    /** Points summed per source and user within [start, end). */
    List<SourceUserPoints> sumBySourceAndUser(UUID tenantId, Instant start, Instant end);
}
