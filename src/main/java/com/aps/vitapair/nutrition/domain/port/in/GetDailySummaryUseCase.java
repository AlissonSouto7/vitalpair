package com.aps.vitapair.nutrition.domain.port.in;

import com.aps.vitapair.nutrition.application.dto.DailySummary;
import java.time.LocalDate;
import java.util.UUID;

public interface GetDailySummaryUseCase {

    DailySummary getSummary(UUID userId, LocalDate date);
}
