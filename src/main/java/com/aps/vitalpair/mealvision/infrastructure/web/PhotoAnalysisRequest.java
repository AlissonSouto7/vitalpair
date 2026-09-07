package com.aps.vitalpair.mealvision.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of the photo analysis request.
 *
 * <p>The size is bounded here because this endpoint spends money: the image becomes input
 * tokens billed by Anthropic, and without a bound the cost of one call is decided by whoever
 * sends it. The 5 MB decoded ceiling is Anthropic's own, which refuses larger images; the base64
 * value is 4/3 of that.
 *
 * @param imageBase64 the image as plain base64, without the {@code data:} prefix
 * @param mediaType   the image type: {@code image/jpeg}, {@code image/png} or {@code image/webp}
 */
public record PhotoAnalysisRequest(
        @NotBlank @Size(max = MAX_BASE64_LENGTH, message = "A foto é grande demais. Envie uma imagem de até 5 MB.")
                String imageBase64,
        @NotBlank
                @Pattern(
                        regexp = "image/(jpeg|png|webp)",
                        message = "mediaType deve ser image/jpeg, image/png ou image/webp")
                String mediaType) {

    /** 5 MB decoded, which is Anthropic's limit, expressed in base64 characters. */
    public static final int MAX_BASE64_LENGTH = 5 * 1024 * 1024 / 3 * 4;
}
