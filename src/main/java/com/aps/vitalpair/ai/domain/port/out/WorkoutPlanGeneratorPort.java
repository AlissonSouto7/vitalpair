package com.aps.vitalpair.ai.domain.port.out;

import java.util.List;

import com.aps.vitalpair.ai.domain.model.WorkoutDay;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;

/** Outbound port to the model that builds the workout plan (implemented over Anthropic). */
public interface WorkoutPlanGeneratorPort {

    /** Generates the 7 days of the week (4 or 5 training days, the rest rest days) for the user's goal. */
    List<WorkoutDay> generateWeek(Goal goal, ActivityLevel activityLevel);
}
