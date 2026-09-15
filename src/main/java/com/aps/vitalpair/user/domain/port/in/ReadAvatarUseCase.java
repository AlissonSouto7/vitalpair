package com.aps.vitalpair.user.domain.port.in;

import java.util.Optional;

/** Reads a stored avatar by the opaque name the profile carries. */
public interface ReadAvatarUseCase {

    /**
     * The image bytes, or empty when the name matches nothing.
     *
     * <p>Takes the object name rather than a user id on purpose. The name is unguessable and is
     * handed out only with the profile, so it acts as the capability to view the photo, which is
     * what lets an {@code <img>} tag load it without an Authorization header it cannot send.
     */
    Optional<byte[]> readAvatar(String objectName);
}
