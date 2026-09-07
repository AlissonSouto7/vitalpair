package com.aps.vitalpair.mealvision.domain.model;

import java.util.List;

/** The result of analysing a meal photo: the foods detected, empty when there is no food. */
public record MealPhotoAnalysis(List<DetectedFood> items) {

    public static MealPhotoAnalysis empty() {
        return new MealPhotoAnalysis(List.of());
    }
}
