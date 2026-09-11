package com.aps.vitalpair.mealvision.application.service;

import org.springframework.stereotype.Service;

import com.aps.vitalpair.entitlement.domain.port.in.AiEntitlementUseCase;
import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;
import com.aps.vitalpair.mealvision.domain.port.in.AnalyzeMealPhotoUseCase;
import com.aps.vitalpair.mealvision.domain.port.out.MealPhotoAnalyzerPort;

/**
 * Orchestrates the photo analysis use case: checks that the person may use it, then delegates
 * to the model port. Stateless: nothing is persisted.
 */
@Service
public class MealVisionService implements AnalyzeMealPhotoUseCase {

    private final MealPhotoAnalyzerPort analyzer;
    private final AiEntitlementUseCase aiEntitlement;

    public MealVisionService(MealPhotoAnalyzerPort analyzer, AiEntitlementUseCase aiEntitlement) {
        this.analyzer = analyzer;
        this.aiEntitlement = aiEntitlement;
    }

    @Override
    public MealPhotoAnalysis analyze(Command command) {
        // Before the image is even looked at: a photo is the most expensive call in the
        // product, and a person without the plan should hear about the plan.
        aiEntitlement.requireAiAccess(command.userId());
        return analyzer.analyze(command.imageBase64(), command.mediaType());
    }
}
