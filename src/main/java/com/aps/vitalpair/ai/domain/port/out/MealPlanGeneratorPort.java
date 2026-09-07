package com.aps.vitalpair.ai.domain.port.out;

import java.util.List;

import com.aps.vitalpair.ai.domain.model.MealPlanItem;
import com.aps.vitalpair.ai.domain.model.NutritionTargets;

/** Outbound port to the model that builds the menu (implemented over Anthropic). */
public interface MealPlanGeneratorPort {

    /** Generates the whole week: 7 days x 4 meals aligned with the user's targets. */
    List<MealPlanItem> generateWeek(NutritionTargets targets);

    /**
     * Generates ONE alternative to the current item: a different dish in the same kcal and macro
     * range. The result keeps the current item's {@code dayIndex} and {@code mealType}.
     */
    MealPlanItem generateAlternative(MealPlanItem current);
}
