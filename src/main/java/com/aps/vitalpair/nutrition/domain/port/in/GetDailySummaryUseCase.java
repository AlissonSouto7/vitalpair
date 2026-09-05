package com.aps.vitalpair.nutrition.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.nutrition.application.dto.DailySummary;

public interface GetDailySummaryUseCase {

    DailySummary getSummary(UUID userId, LocalDate date);
}
