package com.aps.vitalpair.user.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/**
 * Where an avatar image lives, without saying what the storage is.
 *
 * <p>Today the adapter writes to a directory on the server's disk. The port exists so moving to
 * object storage later is one new adapter and no change above this line, which matters because
 * the disk copy lives and dies with the VM.
 */
public interface AvatarStoragePort {

    /**
     * Stores the image and returns the name it was filed under.
     *
     * <p>The name is generated here, never taken from the upload. A client-supplied filename is
     * how path traversal gets in ({@code ../../etc/passwd}) and how one person overwrites
     * another's file, and it has no use: nothing ever shows it.
     *
     * @param userId who the image belongs to, for the audit trail and for cleanup on closure
     * @param jpegBytes an image already validated and re-encoded by the sanitizer
     * @return the opaque object name, which is what goes in {@code users.avatar_url}
     */
    String store(UUID userId, byte[] jpegBytes);

    /** The stored bytes, or empty when the name matches nothing. */
    Optional<byte[]> read(String objectName);

    /**
     * Removes a stored image, if it is still there.
     *
     * <p>Called when a photo is replaced and when an account is closed. A missing file is not an
     * error: the point is that it is gone.
     */
    void delete(String objectName);
}
