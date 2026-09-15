package com.aps.vitalpair.user.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * What the profile now points at.
 *
 * @param avatarUrl the opaque object name, to be fetched at {@code /api/v1/users/avatars/{name}}.
 *     Called avatarUrl because that is the field it lands on in the profile, and it is what the
 *     client stores; it is a name rather than a full URL so the server can move where images
 *     live without every stored value becoming wrong.
 */
public record AvatarResponse(
        @Schema(description = "Opaque name to fetch the photo with.", example = "9f8c2a1b4e6d7f30a5b9c8d7e6f50413.jpg")
                String avatarUrl) {}
