package com.aps.vitalpair.mealvision.domain.port.out;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;

/** Outbound port: delegates the photo analysis to a vision-capable model provider. */
public interface MealPhotoAnalyzerPort {

    MealPhotoAnalysis analyze(String imageBase64, String mediaType);
}
