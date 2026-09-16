package com.aps.vitalpair.user.infrastructure.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.user.domain.port.out.AvatarStoragePort;

/**
 * Avatars on the server's own disk, under a directory this application owns.
 *
 * <p>The object name is generated here and is the only thing that ever reaches the filesystem.
 * It is 32 hex characters from {@link SecureRandom} plus {@code .jpg}, which does three jobs at
 * once: it cannot express a path, so traversal has nothing to work with; it is unguessable, which
 * is what lets the read endpoint stay public so an {@code <img>} tag can use it; and it is new on
 * every upload, so replacing a photo cannot be served from a stale cache.
 *
 * <p>Names that come back in are still validated against {@link #OBJECT_NAME}, even though this
 * class is the only thing that ever generates one. The value travels through the database and
 * back in a URL, so by the time it returns it is input again, and a check that costs a regex is
 * cheaper than trusting a round trip.
 */
@Component
public class FilesystemAvatarStorageAdapter implements AvatarStoragePort {

    private static final Logger log = LoggerFactory.getLogger(FilesystemAvatarStorageAdapter.class);

    /**
     * Exactly what this class generates, and nothing else.
     *
     * <p>Anchored, fixed length, hex only. No dot, no slash, no separator of any kind can match,
     * which is what makes {@code ../} and an absolute path unrepresentable rather than filtered.
     */
    private static final Pattern OBJECT_NAME = Pattern.compile("^[0-9a-f]{32}\\.jpg$");

    private static final SecureRandom RANDOM = new SecureRandom();

    private final Path directory;

    public FilesystemAvatarStorageAdapter(@Value("${vitalpair.avatar.directory}") String directory) {
        // Normalised once, here, so every later path is built from an absolute known root and
        // the resolve() calls below have something trustworthy to be checked against.
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    /**
     * Creates the directory at startup rather than on the first upload.
     *
     * <p>A missing or unwritable volume is a deployment mistake, and it should show up when the
     * container starts, in the logs, not as a 500 for the first person who tries to set a photo.
     */
    @PostConstruct
    void prepareDirectory() {
        try {
            Files.createDirectories(directory);
            if (!Files.isWritable(directory)) {
                throw new IllegalStateException("Avatar directory is not writable: " + directory);
            }
            log.info("Avatars are stored in {}", directory);
        } catch (IOException e) {
            throw new IllegalStateException("Could not prepare the avatar directory: " + directory, e);
        }
    }

    @Override
    public String store(UUID userId, byte[] jpegBytes) {
        byte[] random = new byte[16];
        RANDOM.nextBytes(random);
        String objectName = HexFormat.of().formatHex(random) + ".jpg";

        Path target = resolveSafely(objectName);
        try {
            // Written beside the target and moved into place, so a reader never sees a
            // half-written file: the move is atomic within one filesystem, and a crash
            // mid-write leaves a temp file rather than a corrupt avatar.
            Path temp = Files.createTempFile(directory, "upload-", ".tmp");
            try {
                Files.write(temp, jpegBytes);
                Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                Files.deleteIfExists(temp);
                throw e;
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store the avatar for user " + userId, e);
        }
        return objectName;
    }

    @Override
    public Optional<byte[]> read(String objectName) {
        if (objectName == null || !OBJECT_NAME.matcher(objectName).matches()) {
            // Not an exception: the read endpoint is public, and a malformed name is a 404 like
            // any other miss. Throwing here would turn a probe into a distinguishable error.
            return Optional.empty();
        }
        Path source = resolveSafely(objectName);
        if (!Files.isRegularFile(source)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(source));
        } catch (IOException e) {
            log.warn("Could not read avatar {}", objectName, e);
            return Optional.empty();
        }
    }

    @Override
    public void delete(String objectName) {
        if (objectName == null || !OBJECT_NAME.matcher(objectName).matches()) {
            return;
        }
        try {
            Files.deleteIfExists(resolveSafely(objectName));
        } catch (IOException e) {
            // The photo row is already gone by the time this runs, so a failure here leaves an
            // orphan file and nothing worse. Worth a log, not worth failing the request.
            log.warn("Could not delete avatar {}", objectName, e);
        }
    }

    /**
     * Resolves a name inside the directory, and refuses anything that escapes it.
     *
     * <p>The regex above already makes an escape unrepresentable, so this is the belt to its
     * braces: it holds even if the pattern is loosened by someone later, and it is the check
     * that a reader looking for traversal will actually find.
     */
    private Path resolveSafely(String objectName) {
        Path resolved = directory.resolve(objectName).normalize();
        if (!resolved.startsWith(directory)) {
            throw new IllegalArgumentException("Refusing an avatar path outside the directory");
        }
        return resolved;
    }
}
