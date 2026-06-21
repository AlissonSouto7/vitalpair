package com.aps.vitapair.nutrition.domain.port.in;

import com.aps.vitapair.nutrition.application.dto.LogMealCommand;
import com.aps.vitapair.nutrition.domain.model.FoodLog;
import java.util.UUID;

public interface LogMealUseCase {

    FoodLog logMeal(UUID userId, LogMealCommand command);
}
