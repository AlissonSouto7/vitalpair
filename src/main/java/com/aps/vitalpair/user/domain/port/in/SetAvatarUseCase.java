package com.aps.vitalpair.user.domain.port.in;

import java.util.UUID;

/** Replaces, or removes, the caller's profile photo. */
public interface SetAvatarUseCase {

    /**
     * Validates, re-encodes and stores the image, and points the profile at it.
     *
     * @param userId the owner. Always the authenticated caller: there is no path that sets
     *     somebody else's photo.
     * @param imageBytes the raw upload, which is never what ends up stored
     * @return the object name now on the profile
     */
    String setAvatar(UUID userId, byte[] imageBytes);

    /** Removes the photo and the stored file. Doing it twice is not an error. */
    void removeAvatar(UUID userId);
}
