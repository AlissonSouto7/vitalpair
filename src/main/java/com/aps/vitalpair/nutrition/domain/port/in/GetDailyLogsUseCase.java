package com.aps.vitalpair.nutrition.domain.port.in;

import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface GetDailyLogsUseCase {

    List<FoodLog> getLogs(UUID userId, LocalDate date);
}
