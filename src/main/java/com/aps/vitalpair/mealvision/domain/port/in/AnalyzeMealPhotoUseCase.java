package com.aps.vitalpair.mealvision.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;

/** Inbound port: analyses a meal photo and returns the foods detected. */
public interface AnalyzeMealPhotoUseCase {

    MealPhotoAnalysis analyze(Command command);

    /**
     * The analysis command.
     *
     * @param userId      who is asking, so the use case can check they may use the feature
     * @param imageBase64 the image as plain base64, without the {@code data:} prefix
     * @param mediaType   the image type ({@code image/jpeg}, {@code image/png} or {@code image/webp})
     */
    record Command(UUID userId, String imageBase64, String mediaType) {}
}
