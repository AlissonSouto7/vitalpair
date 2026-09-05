package com.aps.vitalpair.pair.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@ExtendWith(MockitoExtension.class)
class PairServiceTest {

    private static final UUID USER_A = UUID.randomUUID();
    private static final UUID USER_B = UUID.randomUUID();
    private static final UUID TENANT_A = UUID.randomUUID();
    private static final UUID TENANT_B = UUID.randomUUID();
    private static final String CODE = "ABCD2345";

    @Mock
    private PairRepositoryPort pairRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PairService service;

    @Test
    void joinFormaParAtivoEMoveTenantDoConvidado() {
        when(pairRepository.findByInviteCode(CODE)).thenReturn(Optional.of(pendingPair(TENANT_A, USER_A)));
        when(userRepository.findById(USER_B)).thenReturn(Optional.of(user(USER_B, TENANT_B, "Bob")));
        when(userRepository.findById(USER_A)).thenReturn(Optional.of(user(USER_A, TENANT_A, "Ana")));
        when(pairRepository.findById(TENANT_B)).thenReturn(Optional.of(pendingPair(TENANT_B, USER_B)));
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(pairRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PairView view = service.joinPair(USER_B, CODE);

        assertThat(view.status()).isEqualTo(PairStatus.ACTIVE);
        assertThat(view.pairName()).isEqualTo("Ana & Bob");
        assertThat(view.members()).hasSize(2);
        verify(pairRepository).deleteById(TENANT_B); // par pendente vazio do convidado removido
    }

    @Test
    void joinNoProprioParRejeitado() {
        when(pairRepository.findByInviteCode(CODE)).thenReturn(Optional.of(pendingPair(TENANT_A, USER_A)));

        assertThatThrownBy(() -> service.joinPair(USER_A, CODE)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void joinComCodigoIndisponivelRejeitado() {
        Pair active = pendingPair(TENANT_A, USER_A).toBuilder()
                .status(PairStatus.ACTIVE)
                .user2Id(USER_B)
                .build();
        when(pairRepository.findByInviteCode(CODE)).thenReturn(Optional.of(active));

        assertThatThrownBy(() -> service.joinPair(UUID.randomUUID(), CODE)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void joinComCodigoInvalidoRetornaNotFound() {
        when(pairRepository.findByInviteCode(CODE)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.joinPair(USER_B, CODE)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void joinQuandoConvidadoJaTemParceiroRejeitado() {
        when(pairRepository.findByInviteCode(CODE)).thenReturn(Optional.of(pendingPair(TENANT_A, USER_A)));
        when(userRepository.findById(USER_B)).thenReturn(Optional.of(user(USER_B, TENANT_B, "Bob")));
        Pair alreadyActive = pendingPair(TENANT_B, USER_B).toBuilder()
                .status(PairStatus.ACTIVE)
                .build();
        when(pairRepository.findById(TENANT_B)).thenReturn(Optional.of(alreadyActive));

        assertThatThrownBy(() -> service.joinPair(USER_B, CODE)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void generateInviteComParAtivoRejeitado() {
        when(userRepository.findById(USER_A)).thenReturn(Optional.of(user(USER_A, TENANT_A, "Ana")));
        Pair active = pendingPair(TENANT_A, USER_A).toBuilder()
                .status(PairStatus.ACTIVE)
                .build();
        when(pairRepository.findById(TENANT_A)).thenReturn(Optional.of(active));

        assertThatThrownBy(() -> service.generateInvite(USER_A)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void getCurrentPairRetornaConvite() {
        when(userRepository.findById(USER_A)).thenReturn(Optional.of(user(USER_A, TENANT_A, "Ana")));
        when(pairRepository.findById(TENANT_A)).thenReturn(Optional.of(pendingPair(TENANT_A, USER_A)));

        PairView view = service.getCurrentPair(USER_A);

        assertThat(view.inviteCode()).isEqualTo(CODE);
        assertThat(view.status()).isEqualTo(PairStatus.PENDING);
        assertThat(view.members()).hasSize(1);
    }

    private Pair pendingPair(UUID id, UUID user1) {
        return Pair.builder()
                .id(id)
                .user1Id(user1)
                .status(PairStatus.PENDING)
                .inviteCode(CODE)
                .build();
    }

    private User user(UUID id, UUID tenantId, String name) {
        return User.builder()
                .id(id)
                .tenantId(tenantId)
                .email(name.toLowerCase() + "@vitalpair.app")
                .name(name)
                .build();
    }
}
