package com.aps.vitalpair.mealvision.infrastructure.web;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;
import com.aps.vitalpair.mealvision.domain.port.in.AnalyzeMealPhotoUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Análise de refeição por foto com IA. Controller separado do {@code NutritionController}.
 * Stateless: devolve os alimentos detectados; quem registra é o {@code POST /api/v1/nutrition/logs}.
 */
@RestController
@RequestMapping("/api/v1/nutrition")
public class NutritionPhotoController {

    private final AnalyzeMealPhotoUseCase analyzeMealPhotoUseCase;

    public NutritionPhotoController(AnalyzeMealPhotoUseCase analyzeMealPhotoUseCase) {
        this.analyzeMealPhotoUseCase = analyzeMealPhotoUseCase;
    }

    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<PhotoAnalysisResponse>> analyzePhoto(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody PhotoAnalysisRequest request) {
        MealPhotoAnalysis analysis = analyzeMealPhotoUseCase.analyze(
                new AnalyzeMealPhotoUseCase.Command(request.imageBase64(), request.mediaType()));
        return ResponseEntity.ok(ApiResponse.ok(PhotoAnalysisResponse.from(analysis)));
    }
}
