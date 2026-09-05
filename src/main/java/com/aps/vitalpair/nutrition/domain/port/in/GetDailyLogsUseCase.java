package com.aps.vitalpair.nutrition.domain.port.in;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.nutrition.domain.model.FoodLog;

public interface GetDailyLogsUseCase {

    List<FoodLog> getLogs(UUID userId, LocalDate date);
}
