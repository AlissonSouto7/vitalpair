package com.aps.vitalpair.nutrition.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;

public interface LogMealUseCase {

    FoodLog logMeal(UUID userId, LogMealCommand command);
}
