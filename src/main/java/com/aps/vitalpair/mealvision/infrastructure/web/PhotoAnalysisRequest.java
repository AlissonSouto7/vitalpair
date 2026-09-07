package com.aps.vitalpair.mealvision.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Corpo da requisição de análise de foto.
 *
 * <p>O tamanho é limitado aqui porque este endpoint gasta dinheiro: a imagem vira tokens de
 * entrada cobrados pela Anthropic, e sem limite o custo de uma chamada é decidido por quem
 * chama. O teto de 5 MB decodificados é o da própria Anthropic, que recusa imagens maiores;
 * o valor em base64 é 4/3 disso.
 *
 * @param imageBase64 imagem em base64 puro, sem o prefixo {@code data:}
 * @param mediaType   tipo da imagem: {@code image/jpeg}, {@code image/png} ou {@code image/webp}
 */
public record PhotoAnalysisRequest(
        @NotBlank @Size(max = MAX_BASE64_LENGTH, message = "A foto é grande demais. Envie uma imagem de até 5 MB.")
                String imageBase64,
        @NotBlank
                @Pattern(
                        regexp = "image/(jpeg|png|webp)",
                        message = "mediaType deve ser image/jpeg, image/png ou image/webp")
                String mediaType) {

    /** 5 MB decodificados, que é o limite da Anthropic, expressos em caracteres base64. */
    public static final int MAX_BASE64_LENGTH = 5 * 1024 * 1024 / 3 * 4;
}
