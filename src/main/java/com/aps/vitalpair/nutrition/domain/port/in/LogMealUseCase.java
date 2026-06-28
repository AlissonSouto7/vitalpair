package com.aps.vitalpair.nutrition.domain.port.in;

import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import java.util.UUID;

public interface LogMealUseCase {

    FoodLog logMeal(UUID userId, LogMealCommand command);
}
