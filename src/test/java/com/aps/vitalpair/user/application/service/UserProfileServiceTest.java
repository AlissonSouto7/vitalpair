package com.aps.vitalpair.user.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import com.aps.vitalpair.tdee.domain.port.in.CalculateTargetsUseCase;
import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Mascot;
import com.aps.vitalpair.user.domain.model.Sex;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private CalculateTargetsUseCase calculateTargets;

    @Mock
    private RecordWeightUseCase recordWeight;

    @InjectMocks
    private UserProfileService service;

    @Test
    void updatingTheProfileAppliesTheComputedTargetsAndSaves() {
        User existing = User.builder()
                .id(USER_ID)
                .tenantId(TENANT_ID)
                .email("ana@vitalpair.app")
                .name("antigo")
                .build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(calculateTargets.calculate(any())).thenReturn(new TdeeResult(1395, 1918, 1418, 130, 107, 52));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileCommand command = new UpdateProfileCommand(
                "Ana",
                LocalDate.of(1999, 5, 20),
                Sex.FEMALE,
                BigDecimal.valueOf(165),
                BigDecimal.valueOf(65),
                Goal.LOSE_WEIGHT,
                ActivityLevel.LIGHT,
                null,
                null);

        User result = service.updateProfile(USER_ID, command);

        assertThat(result.getName()).isEqualTo("Ana");
        assertThat(result.getGoal()).isEqualTo(Goal.LOSE_WEIGHT);
        assertThat(result.getDailyCalorieTarget()).isEqualTo(1418);
        assertThat(result.getProteinTargetG()).isEqualTo(130);
        assertThat(result.getCarbTargetG()).isEqualTo(107);
        assertThat(result.getFatTargetG()).isEqualTo(52);
    }

    @Test
    void aprofileUpdateWithNoZoneKeepsTheStoredOne() {
        User existing = User.builder()
                .id(USER_ID)
                .tenantId(TENANT_ID)
                .email("ana@vitalpair.app")
                .name("Ana")
                .timeZone(ZoneId.of("Asia/Tokyo"))
                .build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(calculateTargets.calculate(any())).thenReturn(new TdeeResult(1395, 1918, 1418, 130, 107, 52));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // A client that does not send the field is one that does not know about it, not one
        // asking for the zone to be cleared. Overwriting here would move the person's day
        // boundary as a side effect of editing their weight.
        User result = service.updateProfile(USER_ID, commandWithZone(null));

        assertThat(result.getTimeZone()).isEqualTo(ZoneId.of("Asia/Tokyo"));
    }

    @Test
    void aprofileUpdateCarryingAzoneReplacesIt() {
        User existing = User.builder()
                .id(USER_ID)
                .tenantId(TENANT_ID)
                .email("ana@vitalpair.app")
                .name("Ana")
                .timeZone(ZoneId.of("Asia/Tokyo"))
                .build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(calculateTargets.calculate(any())).thenReturn(new TdeeResult(1395, 1918, 1418, 130, 107, 52));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        User result = service.updateProfile(USER_ID, commandWithZone(ZoneId.of("Europe/Lisbon")));

        assertThat(result.getTimeZone()).isEqualTo(ZoneId.of("Europe/Lisbon"));
    }

    private static UpdateProfileCommand commandWithZone(ZoneId zone) {
        return new UpdateProfileCommand(
                "Ana",
                LocalDate.of(1999, 5, 20),
                Sex.FEMALE,
                BigDecimal.valueOf(165),
                BigDecimal.valueOf(65),
                Goal.LOSE_WEIGHT,
                ActivityLevel.LIGHT,
                null,
                zone);
    }

    @Test
    void askingForTheTdeeOfAnIncompleteProfileIsRejected() {
        User incompleto = User.builder()
                .id(USER_ID)
                .email("ana@vitalpair.app")
                .name("Ana")
                .build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(incompleto));

        assertThatThrownBy(() -> service.getTdee(USER_ID)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void aprofileNobodyHasIsNotFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProfile(USER_ID)).isInstanceOf(ResourceNotFoundException.class);
    }

    /**
     * A escolha do mascote, que antes não existia.
     *
     * <p>O bicho era desenhado a partir do papel no par ("você" tinha um rosto, o par tinha
     * outro), dentro do componente. A primeira usuária marcou sexo feminino, viu o rosto
     * masculino e perguntou como trocar; não havia como.
     */
    @Test
    void chooseMascotGravaAescolha() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .tenantId(UUID.randomUUID())
                .email("bel@example.com")
                .name("Bel")
                .build();
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.chooseMascot(id, Mascot.BLOSSOM);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getMascot()).isEqualTo(Mascot.BLOSSOM);
    }

    @Test
    void chooseMascotNaoMexeNoRestoDoPerfil() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .tenantId(UUID.randomUUID())
                .email("bel@example.com")
                .name("Bel")
                .sex(Sex.FEMALE)
                .build();
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.chooseMascot(id, Mascot.SPROUT);

        // O mascote é escolha, não consequência do sexo: alguém que marcou FEMALE pode
        // querer o SPROUT, e quem marcou OTHER precisa poder escolher os dois.
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getSex()).isEqualTo(Sex.FEMALE);
        assertThat(captor.getValue().getName()).isEqualTo("Bel");
    }

    @Test
    void chooseMascotDeContaInexistenteEhNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.chooseMascot(id, Mascot.SPROUT)).isInstanceOf(ResourceNotFoundException.class);
    }
}
