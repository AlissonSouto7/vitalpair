package com.aps.vitalpair.mealvision.domain.model;

import java.util.List;

/** Resultado da análise de uma foto de refeição: a lista de alimentos detectados (vazia se não houver comida). */
public record MealPhotoAnalysis(List<DetectedFood> items) {

    public static MealPhotoAnalysis empty() {
        return new MealPhotoAnalysis(List.of());
    }
}
