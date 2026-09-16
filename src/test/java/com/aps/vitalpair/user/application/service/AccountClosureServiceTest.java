package com.aps.vitalpair.user.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
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

import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.in.LeavePairUseCase;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.AvatarStoragePort;
import com.aps.vitalpair.user.domain.port.out.PersonalDataErasurePort;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * What closing an account actually erases.
 *
 * <p>The photo is the case worth writing down: clearing the column is not erasure while the file
 * is still on the volume, reachable by anyone who kept the URL. A person who asks to be forgotten
 * and whose face stays on the server has not been forgotten.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccountClosureServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final String AVATAR = "abcdef0123456789abcdef0123456789.jpg";

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private PairRepositoryPort pairRepository;

    @Mock
    private LeavePairUseCase leavePairUseCase;

    @Mock
    private PersonalDataErasurePort personalDataErasure;

    @Mock
    private RefreshTokenStorePort refreshTokenStore;

    @Mock
    private AvatarStoragePort avatarStorage;

    @InjectMocks
    private AccountClosureService service;

    @Test
    void thephotoFileIsDeletedAndNotJustUnlinked() {
        givenUser(AVATAR, null);
        givenSoloPair();

        service.closeAccount(USER);

        // Without this the image outlives the account: the row stops naming it, and the file
        // stays on the volume answering the same public URL as before.
        verify(avatarStorage).delete(AVATAR);
    }

    @Test
    void thephotoColumnIsCleared() {
        givenUser(AVATAR, null);
        givenSoloPair();

        service.closeAccount(USER);

        assertThat(savedUser().getAvatarUrl()).isNull();
    }

    @Test
    void anaccountWithNoPhotoAsksStorageForNothing() {
        givenUser(null, null);
        givenSoloPair();

        service.closeAccount(USER);

        verify(avatarStorage, never()).delete(any());
    }

    @Test
    void theemailIsFreedRatherThanBlanked() {
        givenUser(null, null);
        givenSoloPair();

        service.closeAccount(USER);

        // The column is unique, so leaving the real address would lock the person out of their
        // own e-mail if they ever came back.
        assertThat(savedUser().getEmail()).isNotEqualTo("alisson@example.com").contains(USER.toString());
    }

    @Test
    void personalRecordsAreErasedAndSessionsRevoked() {
        givenUser(null, null);
        givenSoloPair();

        service.closeAccount(USER);

        verify(personalDataErasure).erasePersonalRecords(USER);
        // Last in the service on purpose, so a failure earlier leaves the account usable
        // rather than locked out of a closure that did not finish.
        verify(refreshTokenStore).revokeAllForUser(USER);
    }

    @Test
    void anactivePairIsLeftFirst() {
        givenUser(null, null);
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(USER)
                        .user2Id(UUID.randomUUID())
                        .status(PairStatus.ACTIVE)
                        .build()));

        service.closeAccount(USER);

        // Otherwise the partner is left paired with a tombstone: a member who no longer exists
        // and who they can never replace.
        verify(leavePairUseCase).leavePair(USER);
    }

    @Test
    void closingTwiceDoesNothingTheSecondTime() {
        givenUser(AVATAR, Instant.parse("2026-01-01T00:00:00Z"));

        service.closeAccount(USER);

        // The outcome the caller wanted is already true, and repeating the erasure would mean
        // deleting a file the row no longer names.
        verify(personalDataErasure, never()).erasePersonalRecords(any());
        verify(avatarStorage, never()).delete(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void anunknownAccountIsNotFound() {
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.closeAccount(USER)).isInstanceOf(ResourceNotFoundException.class);
    }

    private void givenUser(String avatarUrl, Instant deletedAt) {
        User user = User.builder()
                .id(USER)
                .tenantId(TENANT)
                .email("alisson@example.com")
                .name("Alisson")
                .avatarUrl(avatarUrl)
                .deletedAt(deletedAt)
                .build();
        when(userRepository.findById(USER)).thenReturn(Optional.of(user));
    }

    private void givenSoloPair() {
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(USER)
                        .status(PairStatus.PENDING)
                        .build()));
    }

    private User savedUser() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        return captor.getValue();
    }
}
