package com.aps.vitalpair.user.application.service;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.in.LeavePairUseCase;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.CloseAccountUseCase;
import com.aps.vitalpair.user.domain.port.out.PersonalDataErasurePort;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Closing an account, in the order the constraints require.
 *
 * <p>Leave the pair, erase the personal records, strip the identity off the row, end every
 * session. Each step depends on the one before it: a person still paired would strand their
 * partner in a pair with a tombstone, and the erasure has to happen while the rows are
 * still reachable.
 */
@Service
public class AccountClosureService implements CloseAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(AccountClosureService.class);

    /**
     * A domain nobody can receive mail at.
     *
     * <p>Reserved by RFC 2606 precisely so it can never be registered, which matters because
     * the scrubbed address stays in a UNIQUE column: if two closed accounts collided the
     * second closure would fail. The user id makes each one distinct.
     */
    private static final String TOMBSTONE_DOMAIN = "@removed.invalid";

    /** What the pair screen and the feed show where the name used to be. */
    private static final String TOMBSTONE_NAME = "Conta encerrada";

    private final UserRepositoryPort userRepository;
    private final PairRepositoryPort pairRepository;
    private final LeavePairUseCase leavePairUseCase;
    private final PersonalDataErasurePort personalDataErasure;
    private final RefreshTokenStorePort refreshTokenStore;

    public AccountClosureService(
            UserRepositoryPort userRepository,
            PairRepositoryPort pairRepository,
            LeavePairUseCase leavePairUseCase,
            PersonalDataErasurePort personalDataErasure,
            RefreshTokenStorePort refreshTokenStore) {
        this.userRepository = userRepository;
        this.pairRepository = pairRepository;
        this.leavePairUseCase = leavePairUseCase;
        this.personalDataErasure = personalDataErasure;
        this.refreshTokenStore = refreshTokenStore;
    }

    @Override
    @Transactional
    public void closeAccount(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        if (user.getDeletedAt() != null) {
            // Closing twice is not an error worth showing: the outcome the caller wanted is
            // already true.
            return;
        }

        // First, because a person cannot be left in a pair with a tombstone: the partner
        // would see a member who no longer exists and could never invite anyone else.
        // Leaving also moves this person's rows into a tenant of their own, which is where
        // the erasure below then finds them.
        boolean paired = pairRepository
                .findById(user.getTenantId())
                .map(pair -> pair.getStatus() == PairStatus.ACTIVE)
                .orElse(false);
        if (paired) {
            leavePairUseCase.leavePair(userId);
        }

        personalDataErasure.erasePersonalRecords(userId);

        // Read again: leaving moved the person to a new tenant, so the instance loaded at
        // the top is stale on that column.
        User current =
                userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        userRepository.save(current.toBuilder()
                // Freed rather than blanked: the column is UNIQUE, so leaving the old value
                // would lock the person out of their own address for good if they came back.
                .email(userId + TOMBSTONE_DOMAIN)
                .name(TOMBSTONE_NAME)
                .passwordHash(null)
                .birthDate(null)
                .sex(null)
                .heightCm(null)
                .weightKg(null)
                .goal(null)
                .activityLevel(null)
                .dailyCalorieTarget(null)
                .proteinTargetG(null)
                .carbTargetG(null)
                .fatTargetG(null)
                .avatarUrl(null)
                .emailVerified(false)
                .deletedAt(Instant.now())
                .build());

        // Last, so a failure above leaves the account usable rather than locked out of a
        // closure that did not finish.
        refreshTokenStore.revokeAllForUser(userId);

        log.info("Account {} closed", userId);
    }
}
