package com.aps.vitalpair.mealvision.domain.port.in;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;

/** Porta de entrada: analisa uma foto de refeição e devolve os alimentos detectados. */
public interface AnalyzeMealPhotoUseCase {

    MealPhotoAnalysis analyze(Command command);

    /**
     * Comando da análise.
     *
     * @param imageBase64 imagem em base64 puro (sem o prefixo {@code data:})
     * @param mediaType   tipo da imagem ({@code image/jpeg}, {@code image/png} ou {@code image/webp})
     */
    record Command(String imageBase64, String mediaType) {
    }
}
