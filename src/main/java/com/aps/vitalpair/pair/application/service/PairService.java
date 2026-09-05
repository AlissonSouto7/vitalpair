package com.aps.vitalpair.pair.application.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.pair.application.dto.MemberView;
import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.InvitePreview;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;
import com.aps.vitalpair.pair.domain.port.in.GenerateInviteUseCase;
import com.aps.vitalpair.pair.domain.port.in.GetCurrentPairUseCase;
import com.aps.vitalpair.pair.domain.port.in.GetInvitePreviewUseCase;
import com.aps.vitalpair.pair.domain.port.in.JoinPairUseCase;
import com.aps.vitalpair.pair.domain.port.in.UpdateRelationshipTypeUseCase;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.event.PairFormedEvent;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Casos de uso do par (tenant). Ao aceitar um convite, o usuário que entra é movido para o tenant
 * do par convidante, o par é ativado e o par pendente vazio do convidado é removido.
 */
@Service
public class PairService
        implements GetCurrentPairUseCase,
                GenerateInviteUseCase,
                JoinPairUseCase,
                UpdateRelationshipTypeUseCase,
                GetInvitePreviewUseCase {

    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PairService(
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
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

        // Move o convidado para o tenant do par convidante antes de remover o par antigo (FK).
        userRepository.save(joiner.toBuilder().tenantId(target.getId()).build());

        User inviter = userRepository
                .findById(target.getUser1Id())
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", target.getUser1Id()));

        Pair activated = pairRepository.save(target.toBuilder()
                .user2Id(userId)
                .status(PairStatus.ACTIVE)
                .pairName(inviter.getName() + " & " + joiner.getName())
                .build());

        if (oldPair != null && !oldPairId.equals(target.getId()) && oldPair.getStatus() == PairStatus.PENDING) {
            pairRepository.deleteById(oldPairId);
        }

        eventPublisher.publishEvent(new PairFormedEvent(activated.getId(), activated.getUser1Id(), userId));
        return toView(activated);
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
