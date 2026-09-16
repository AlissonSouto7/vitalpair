package com.aps.vitalpair.user.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.aps.vitalpair.shared.image.ImageSanitizer;

/**
 * Body of the avatar upload.
 *
 * <p>The size is bounded here as well as in the sanitizer, and the two bounds do different jobs.
 * This one refuses the request from its declared length before the string is decoded into a
 * second copy in memory; the sanitizer's bound is on the decoded bytes and is what protects the
 * service when it is called from anywhere but this controller.
 *
 * <p>No media type field. The meal photo endpoint has one because Anthropic's API requires it,
 * and it is worth saying plainly that such a field is a label the client writes: it is not
 * evidence of anything. Here the format is established from the bytes, so there is nothing for
 * the client to declare and nothing for it to get wrong or lie about.
 *
 * @param imageBase64 the image as plain base64, without the {@code data:} prefix
 */
public record AvatarUploadRequest(
        @NotBlank(message = "Envie uma imagem.")
                @Size(max = MAX_BASE64_LENGTH, message = "A imagem é grande demais. Envie uma foto de até 4 MB.")
                String imageBase64) {

    /** The sanitizer's byte ceiling expressed in base64 characters, which are 4 per 3 bytes. */
    public static final int MAX_BASE64_LENGTH = ImageSanitizer.MAX_INPUT_BYTES / 3 * 4 + 4;
}
