package com.aps.vitalpair.mealvision.application.service;

import org.springframework.stereotype.Service;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;
import com.aps.vitalpair.mealvision.domain.port.in.AnalyzeMealPhotoUseCase;
import com.aps.vitalpair.mealvision.domain.port.out.MealPhotoAnalyzerPort;

/** Orchestrates the photo analysis use case by delegating to the model port. Stateless: nothing is persisted. */
@Service
public class MealVisionService implements AnalyzeMealPhotoUseCase {

    private final MealPhotoAnalyzerPort analyzer;

    public MealVisionService(MealPhotoAnalyzerPort analyzer) {
        this.analyzer = analyzer;
    }

    @Override
    public MealPhotoAnalysis analyze(Command command) {
        return analyzer.analyze(command.imageBase64(), command.mediaType());
    }
}
