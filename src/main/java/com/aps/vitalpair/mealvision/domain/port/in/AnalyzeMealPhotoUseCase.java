package com.aps.vitalpair.mealvision.domain.port.in;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;

/** Inbound port: analyses a meal photo and returns the foods detected. */
public interface AnalyzeMealPhotoUseCase {

    MealPhotoAnalysis analyze(Command command);

    /**
     * The analysis command.
     *
     * @param imageBase64 the image as plain base64, without the {@code data:} prefix
     * @param mediaType   the image type ({@code image/jpeg}, {@code image/png} or {@code image/webp})
     */
    record Command(String imageBase64, String mediaType) {}
}
