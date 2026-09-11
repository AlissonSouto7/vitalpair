package com.aps.vitalpair.mealvision.infrastructure.web;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;
import com.aps.vitalpair.mealvision.domain.port.in.AnalyzeMealPhotoUseCase;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.StandardApiResponses;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Meal analysis from a photo. A controller separate from {@code NutritionController}. Stateless:
 * it returns the foods detected; logging is {@code POST /api/v1/nutrition/logs}.
 */
@Tag(name = "Meal photo", description = "Estimating what is on a plate from a photograph, with AI.")
@RestController
@RequestMapping("/api/v1/nutrition")
public class NutritionPhotoController {

    private final AnalyzeMealPhotoUseCase analyzeMealPhotoUseCase;

    public NutritionPhotoController(AnalyzeMealPhotoUseCase analyzeMealPhotoUseCase) {
        this.analyzeMealPhotoUseCase = analyzeMealPhotoUseCase;
    }

    @StandardApiResponses
    @Operation(
            summary = "Identify the foods on a plate",
            description =
                    "Sends the photo to the model and returns each food found with an estimated portion in grams and its macros. Nothing is stored: the caller edits the result and logs it through the meal endpoint. The image is capped at 5 MB decoded and must be JPEG, PNG or WebP. Limited to twenty analyses an hour per user.")
    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<PhotoAnalysisResponse>> analyzePhoto(
            @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody PhotoAnalysisRequest request) {
        MealPhotoAnalysis analysis = analyzeMealPhotoUseCase.analyze(
                new AnalyzeMealPhotoUseCase.Command(principal.userId(), request.imageBase64(), request.mediaType()));
        return ResponseEntity.ok(ApiResponse.ok(PhotoAnalysisResponse.from(analysis)));
    }
}
