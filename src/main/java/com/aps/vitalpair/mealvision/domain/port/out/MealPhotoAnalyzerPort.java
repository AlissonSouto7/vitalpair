package com.aps.vitalpair.mealvision.domain.port.out;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;

/** Porta de saída: delega a análise da foto a um provedor de IA com visão. */
public interface MealPhotoAnalyzerPort {

    MealPhotoAnalysis analyze(String imageBase64, String mediaType);
}
