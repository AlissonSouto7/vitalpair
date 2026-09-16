package com.aps.vitalpair.user.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.shared.image.ImageSanitizer;
import com.aps.vitalpair.shared.image.InvalidImageException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.AvatarStoragePort;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The order in which a photo is replaced, which is the part that can lose one.
 *
 * <p>Validate, store the new file, point the profile at it, delete the old file. Any other order
 * has a window where the profile names a file that is not there, and the person sees a broken
 * image for a photo they still have.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvatarServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final byte[] UPLOAD = "raw upload".getBytes(StandardCharsets.UTF_8);
    private static final byte[] CLEAN = "re-encoded".getBytes(StandardCharsets.UTF_8);
    private static final String OLD_NAME = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg";
    private static final String NEW_NAME = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg";

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private AvatarStoragePort avatarStorage;

    @Mock
    private ImageSanitizer sanitizer;

    @InjectMocks
    private AvatarService service;

    @Test
    void thestoredBytesAreTheSanitizedOnesAndNeverTheUpload() {
        givenUserWithAvatar(null);
        when(sanitizer.sanitize(UPLOAD)).thenReturn(CLEAN);
        when(avatarStorage.store(USER, CLEAN)).thenReturn(NEW_NAME);

        service.setAvatar(USER, UPLOAD);

        ArgumentCaptor<byte[]> stored = ArgumentCaptor.forClass(byte[].class);
        verify(avatarStorage).store(any(), stored.capture());
        // The whole security model is that what arrives is not what is kept.
        assertThat(stored.getValue()).isEqualTo(CLEAN).isNotEqualTo(UPLOAD);
    }

    @Test
    void theprofilePointsAtTheNewName() {
        givenUserWithAvatar(null);
        when(sanitizer.sanitize(UPLOAD)).thenReturn(CLEAN);
        when(avatarStorage.store(USER, CLEAN)).thenReturn(NEW_NAME);

        String returned = service.setAvatar(USER, UPLOAD);

        assertThat(returned).isEqualTo(NEW_NAME);
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getAvatarUrl()).isEqualTo(NEW_NAME);
    }

    @Test
    void replacingAphotoDeletesTheOldFile() {
        givenUserWithAvatar(OLD_NAME);
        when(sanitizer.sanitize(UPLOAD)).thenReturn(CLEAN);
        when(avatarStorage.store(USER, CLEAN)).thenReturn(NEW_NAME);

        service.setAvatar(USER, UPLOAD);

        // Otherwise every change leaves a file nobody can reach and nothing will ever remove,
        // on a volume with no cleanup job.
        verify(avatarStorage).delete(OLD_NAME);
    }

    @Test
    void arefusedImageLeavesTheExistingPhotoAlone() {
        givenUserWithAvatar(OLD_NAME);
        when(sanitizer.sanitize(UPLOAD)).thenThrow(new InvalidImageException("nope"));

        assertThatThrownBy(() -> service.setAvatar(USER, UPLOAD)).isInstanceOf(InvalidImageException.class);

        // Nothing written, nothing deleted, nothing saved: sending a bad file must not cost
        // somebody the photo they already had.
        verify(avatarStorage, never()).store(any(), any());
        verify(avatarStorage, never()).delete(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void theoldFileIsDeletedOnlyAfterTheProfileStopsPointingAtIt() {
        givenUserWithAvatar(OLD_NAME);
        when(sanitizer.sanitize(UPLOAD)).thenReturn(CLEAN);
        when(avatarStorage.store(USER, CLEAN)).thenReturn(NEW_NAME);

        service.setAvatar(USER, UPLOAD);

        // The order is the invariant. Deleting first would leave a window where the profile
        // still names a file that is already gone, and a reader in that window sees a broken
        // image rather than the old photo or the new one.
        var order = org.mockito.Mockito.inOrder(avatarStorage, userRepository);
        order.verify(avatarStorage).store(USER, CLEAN);
        order.verify(userRepository).save(any());
        order.verify(avatarStorage).delete(OLD_NAME);
    }

    @Test
    void removingClearsTheProfileAndDeletesTheFile() {
        givenUserWithAvatar(OLD_NAME);

        service.removeAvatar(USER);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getAvatarUrl()).isNull();
        verify(avatarStorage).delete(OLD_NAME);
    }

    @Test
    void removingWhenThereIsNoPhotoDoesNothing() {
        givenUserWithAvatar(null);

        service.removeAvatar(USER);

        // Idempotent: the outcome asked for is already true, and a delete(null) would reach the
        // adapter with nothing to work on.
        verify(userRepository, never()).save(any());
        verify(avatarStorage, never()).delete(any());
    }

    @Test
    void anunknownUserIsNotFoundRatherThanAcrash() {
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.setAvatar(USER, UPLOAD)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.removeAvatar(USER)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void readingDelegatesToStorage() {
        when(avatarStorage.read(NEW_NAME)).thenReturn(Optional.of(CLEAN));

        assertThat(service.readAvatar(NEW_NAME)).contains(CLEAN);
    }

    @Test
    void readingSomethingThatIsNotThereIsEmpty() {
        when(avatarStorage.read("missing.jpg")).thenReturn(Optional.empty());

        assertThat(service.readAvatar("missing.jpg")).isEmpty();
    }

    private void givenUserWithAvatar(String avatarUrl) {
        when(userRepository.findById(USER))
                .thenReturn(Optional.of(User.builder()
                        .id(USER)
                        .tenantId(TENANT)
                        .email("a@b.com")
                        .name("Alisson")
                        .avatarUrl(avatarUrl)
                        .build()));
    }
}
