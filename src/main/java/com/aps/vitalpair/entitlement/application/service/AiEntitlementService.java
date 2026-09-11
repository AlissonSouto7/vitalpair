package com.aps.vitalpair.entitlement.application.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.entitlement.domain.exception.AiAccessRequiredException;
import com.aps.vitalpair.entitlement.domain.port.in.AiEntitlementUseCase;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Applies the rule in {@link AiEntitlementUseCase}: own plan first, then the partner's,
 * and only while the pair is active.
 *
 * <p>The pair is the tenant, so the person's pair is the one their tenant id names; a
 * pending pair has a single member and an ended one lends nothing. The clock is injected so
 * a test can stand at any moment relative to an expiry without waiting for it.
 */
@Service
public class AiEntitlementService implements AiEntitlementUseCase {

    private final UserRepositoryPort userRepository;
    private final PairRepositoryPort pairRepository;
    private final Clock clock;

    public AiEntitlementService(UserRepositoryPort userRepository, PairRepositoryPort pairRepository, Clock clock) {
        this.userRepository = userRepository;
        this.pairRepository = pairRepository;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public Entitlement entitlementOf(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        Instant now = clock.instant();
        boolean access = user.hasPremium(now)
                || partnerOf(user).map(partner -> partner.hasPremium(now)).orElse(false);
        return new Entitlement(user.getPlan(), access);
    }

    @Override
    @Transactional(readOnly = true)
    public void requireAiAccess(UUID userId) {
        if (!entitlementOf(userId).aiAccess()) {
            throw new AiAccessRequiredException();
        }
    }

    /** The other member of the person's pair, when the pair is active and has one. */
    private Optional<User> partnerOf(User user) {
        return pairRepository
                .findById(user.getTenantId())
                .filter(pair -> pair.getStatus() == PairStatus.ACTIVE)
                .flatMap(pair -> otherMemberId(pair, user.getId()))
                .flatMap(userRepository::findById);
    }

    private static Optional<UUID> otherMemberId(Pair pair, UUID userId) {
        if (userId.equals(pair.getUser1Id())) {
            return Optional.ofNullable(pair.getUser2Id());
        }
        if (userId.equals(pair.getUser2Id())) {
            return Optional.ofNullable(pair.getUser1Id());
        }
        return Optional.empty();
    }
}
