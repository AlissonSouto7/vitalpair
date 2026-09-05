package com.aps.vitalpair.mealvision.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Corpo da requisição de análise de foto.
 *
 * @param imageBase64 imagem em base64 puro, sem o prefixo {@code data:}
 * @param mediaType   tipo da imagem: {@code image/jpeg}, {@code image/png} ou {@code image/webp}
 */
public record PhotoAnalysisRequest(
        @NotBlank String imageBase64,
        @NotBlank
                @Pattern(
                        regexp = "image/(jpeg|png|webp)",
                        message = "mediaType deve ser image/jpeg, image/png ou image/webp")
                String mediaType) {}
