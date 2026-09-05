package com.aps.vitalpair.activity.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;

public interface GetActivitySummaryUseCase {

    ActivitySummary getSummary(UUID userId, LocalDate date);
}
