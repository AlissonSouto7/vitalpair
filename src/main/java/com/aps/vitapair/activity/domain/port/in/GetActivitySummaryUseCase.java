package com.aps.vitapair.activity.domain.port.in;

import com.aps.vitapair.activity.application.dto.ActivitySummary;
import java.time.LocalDate;
import java.util.UUID;

public interface GetActivitySummaryUseCase {

    ActivitySummary getSummary(UUID userId, LocalDate date);
}
