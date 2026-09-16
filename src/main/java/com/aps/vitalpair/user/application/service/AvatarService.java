package com.aps.vitalpair.user.application.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.shared.image.ImageSanitizer;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.ReadAvatarUseCase;
import com.aps.vitalpair.user.domain.port.in.SetAvatarUseCase;
import com.aps.vitalpair.user.domain.port.out.AvatarStoragePort;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Setting and reading a profile photo.
 *
 * <p>Separate from {@link UserProfileService} because it owns a second resource: the profile row
 * and a file, which have to be kept in step. Folding it into the profile update would also have
 * meant an image arriving on the same request that recomputes calorie targets, and the two have
 * nothing to do with each other.
 *
 * <p>The order of operations is deliberate: validate, then store the new file, then point the
 * profile at it, then delete the old file. A failure at any step leaves the person with the photo
 * they had, never with a profile pointing at a file that is not there.
 */
@Service
public class AvatarService implements SetAvatarUseCase, ReadAvatarUseCase {

    private final UserRepositoryPort userRepository;
    private final AvatarStoragePort avatarStorage;
    private final ImageSanitizer sanitizer;

    public AvatarService(UserRepositoryPort userRepository, AvatarStoragePort avatarStorage, ImageSanitizer sanitizer) {
        this.userRepository = userRepository;
        this.avatarStorage = avatarStorage;
        this.sanitizer = sanitizer;
    }

    @Override
    @Transactional
    public String setAvatar(UUID userId, byte[] imageBytes) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        // Before anything is written: the sanitizer throws on a file we will not store, and it
        // is what guarantees the bytes below are an image this application produced.
        byte[] clean = sanitizer.sanitize(imageBytes);

        String previous = user.getAvatarUrl();
        String objectName = avatarStorage.store(userId, clean);
        userRepository.save(user.toBuilder().avatarUrl(objectName).build());

        // Last, and only once the profile no longer refers to it. Deleting first would leave a
        // window where the old name is still on the profile and its file is already gone.
        if (previous != null && !previous.equals(objectName)) {
            avatarStorage.delete(previous);
        }
        return objectName;
    }

    @Override
    @Transactional
    public void removeAvatar(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        String previous = user.getAvatarUrl();
        if (previous == null) {
            return;
        }
        userRepository.save(user.toBuilder().avatarUrl(null).build());
        avatarStorage.delete(previous);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<byte[]> readAvatar(String objectName) {
        return avatarStorage.read(objectName);
    }
}
