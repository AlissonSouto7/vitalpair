package com.aps.vitalpair.pair.application.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.pair.application.dto.MemberView;
import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.InviteCode;
import com.aps.vitalpair.pair.domain.model.InvitePreview;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;
import com.aps.vitalpair.pair.domain.port.in.GenerateInviteUseCase;
import com.aps.vitalpair.pair.domain.port.in.GetCurrentPairUseCase;
import com.aps.vitalpair.pair.domain.port.in.GetInvitePreviewUseCase;
import com.aps.vitalpair.pair.domain.port.in.JoinPairUseCase;
import com.aps.vitalpair.pair.domain.port.in.LeavePairUseCase;
import com.aps.vitalpair.pair.domain.port.in.UpdateRelationshipTypeUseCase;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.pair.domain.port.out.TenantDataMigrationPort;
import com.aps.vitalpair.shared.event.PairEndedEvent;
import com.aps.vitalpair.shared.event.PairFormedEvent;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Use cases of the pair (the tenant). On accepting an invite, the joining user is moved into the
 * inviter's tenant along with everything they had recorded, the pair is activated, and the
 * guest's now-empty pending pair is removed. Leaving reverses the first half of that for both
 * people and leaves the competition behind.
 */
@Service
public class PairService
        implements GetCurrentPairUseCase,
                GenerateInviteUseCase,
                JoinPairUseCase,
                LeavePairUseCase,
                UpdateRelationshipTypeUseCase,
                GetInvitePreviewUseCase {

    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;
    private final TenantDataMigrationPort tenantDataMigration;
    private final ApplicationEventPublisher eventPublisher;

    public PairService(
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository,
            TenantDataMigrationPort tenantDataMigration,
            ApplicationEventPublisher eventPublisher) {
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
        this.tenantDataMigration = tenantDataMigration;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional(readOnly = true)
    public PairView getCurrentPair(UUID userId) {
        return toView(currentPairOf(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public PairView generateInvite(UUID userId) {
        Pair pair = currentPairOf(userId);
        if (pair.getStatus() == PairStatus.ACTIVE) {
            throw new BusinessRuleException("Você já tem um parceiro");
        }
        return toView(pair);
    }

    @Override
    @Transactional
    public PairView joinPair(UUID userId, String inviteCode) {
        Pair target = pairRepository
                .findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Convite inválido"));

        if (target.getStatus() != PairStatus.PENDING || target.getUser2Id() != null) {
            throw new BusinessRuleException("Este convite não está mais disponível");
        }
        if (userId.equals(target.getUser1Id())) {
            throw new BusinessRuleException("Você não pode entrar no seu próprio par");
        }

        User joiner =
                userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        UUID oldPairId = joiner.getTenantId();
        Pair oldPair = pairRepository.findById(oldPairId).orElse(null);
        if (oldPair != null && oldPair.getStatus() == PairStatus.ACTIVE) {
            throw new BusinessRuleException("Você já tem um parceiro");
        }

        // The guest moves to the inviter's tenant, and so does everything they recorded
        // before joining. Without the second half, a guest who had already logged a meal
        // could not join at all: the pending pair they are leaving cannot be deleted while
        // any row still references it, and the join failed with a 500.
        userRepository.save(joiner.toBuilder().tenantId(target.getId()).build());
        tenantDataMigration.moveUserData(userId, oldPairId, target.getId());

        User inviter = userRepository
                .findById(target.getUser1Id())
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", target.getUser1Id()));

        Pair activated = pairRepository.save(target.toBuilder()
                .user2Id(userId)
                .status(PairStatus.ACTIVE)
                .pairName(inviter.getName() + " & " + joiner.getName())
                .build());

        if (oldPair != null && !oldPairId.equals(target.getId()) && oldPair.getStatus() == PairStatus.PENDING) {
            // Weekly scores and missions stay behind rather than following the person: they
            // describe a competition that had one participant, and crediting that total to a
            // slot in the new pair would be a score nobody earned there.
            tenantDataMigration.discardTenantOwnedData(oldPairId);
            pairRepository.deleteById(oldPairId);
        }

        eventPublisher.publishEvent(new PairFormedEvent(activated.getId(), activated.getUser1Id(), userId));
        return toView(activated);
    }

    @Override
    @Transactional
    public PairView leavePair(UUID userId) {
        Pair pair = currentPairOf(userId);
        if (pair.getStatus() != PairStatus.ACTIVE) {
            throw new BusinessRuleException("Você ainda não tem um parceiro");
        }

        UUID partnerId = userId.equals(pair.getUser1Id()) ? pair.getUser2Id() : pair.getUser1Id();
        if (partnerId == null) {
            throw new BusinessRuleException("Você ainda não tem um parceiro");
        }

        // Both people leave, not only the one who asked. The alternative is letting one of
        // them keep the tenant, and with it the other's meals, weights and score: rows the
        // person who left can no longer reach, since every query is scoped by tenant.
        Pair leaverTenant = freshTenantFor(userId, pair.getRelationshipType());
        Pair partnerTenant = freshTenantFor(partnerId, pair.getRelationshipType());

        // The old pair keeps its seasons, its weekly scores and its ledger. Deleting them
        // would not just erase a record: the season history is summed live from the ledger
        // every time it is read, so removing the rows would recompute every past season
        // with a rival score of zero and hand the loser the win. What happened between two
        // people stays with the pair it happened in; it is simply nobody's tenant now.
        pairRepository.save(pair.toBuilder()
                .user1Id(null)
                .user2Id(null)
                .status(PairStatus.ENDED)
                .build());

        eventPublisher.publishEvent(new PairEndedEvent(pair.getId(), userId, partnerId));
        return toView(leaverTenant);
    }

    /**
     * Moves one person into a tenant of their own, carrying what they recorded.
     *
     * <p>A user cannot exist without a tenant: {@code users.tenant_id} is NOT NULL. So
     * leaving is not clearing a column, it is minting a pending pair and migrating into it,
     * which is exactly what registration does for a new account.
     *
     * <p>What the move decides is reachability, and only for the tables read by tenant: the
     * feed, the plans, the ledger. Meals and activities are read by user id and would stay
     * visible either way, but they move too, so that a row's tenant always names the pair
     * the person was in when they wrote it.
     */
    private Pair freshTenantFor(UUID userId, RelationshipType relationshipType) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        UUID oldTenantId = user.getTenantId();

        // Flushed rather than merely saved: moveUserData reassigns rows with SQL that does
        // not go through the persistence context, and JPA would otherwise still be holding
        // this insert. The update then fails on a foreign key to a pair the database has not
        // seen yet, which is a 500 with a message about user_badges that says nothing about
        // what actually happened.
        Pair tenant = pairRepository.saveAndFlush(Pair.builder()
                .inviteCode(InviteCode.generate())
                .status(PairStatus.PENDING)
                .relationshipType(relationshipType)
                .build());

        userRepository.save(user.toBuilder().tenantId(tenant.getId()).build());
        tenantDataMigration.moveUserData(userId, oldTenantId, tenant.getId());

        return pairRepository.save(tenant.toBuilder().user1Id(userId).build());
    }

    @Override
    @Transactional
    public PairView updateRelationshipType(UUID userId, RelationshipType type) {
        Pair pair = currentPairOf(userId);
        return toView(
                pairRepository.save(pair.toBuilder().relationshipType(type).build()));
    }

    @Override
    @Transactional(readOnly = true)
    public InvitePreview getInvitePreview(String inviteCode) {
        Pair pair = pairRepository
                .findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Convite não encontrado"));

        UUID inviterId = pair.getUser1Id() != null ? pair.getUser1Id() : pair.getUser2Id();
        String inviterName = inviterId == null
                ? null
                : userRepository
                        .findById(inviterId)
                        .map(User::getName)
                        .map(this::firstName)
                        .orElse(null);

        boolean full =
                pair.getStatus() == PairStatus.ACTIVE || (pair.getUser1Id() != null && pair.getUser2Id() != null);

        return new InvitePreview(inviterName, pair.getRelationshipType(), full);
    }

    private String firstName(String fullName) {
        if (fullName == null) {
            return null;
        }
        String trimmed = fullName.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }
        return trimmed.split("\\s+")[0];
    }

    private Pair currentPairOf(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        return pairRepository
                .findById(user.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Par não encontrado"));
    }

    private PairView toView(Pair pair) {
        List<MemberView> members = new ArrayList<>();
        addMember(members, pair.getUser1Id());
        addMember(members, pair.getUser2Id());
        return new PairView(
                pair.getId(),
                pair.getPairName(),
                pair.getStatus(),
                pair.getRelationshipType(),
                pair.getInviteCode(),
                members);
    }

    private void addMember(List<MemberView> members, UUID userId) {
        if (userId == null) {
            return;
        }
        userRepository
                .findById(userId)
                .ifPresent(user -> members.add(
                        new MemberView(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl())));
    }
}
