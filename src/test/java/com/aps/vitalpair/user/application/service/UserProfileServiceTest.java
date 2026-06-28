package com.aps.vitalpair.user.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import com.aps.vitalpair.tdee.domain.port.in.CalculateTargetsUseCase;
import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();

    @Mock
    private UserRepositoryPort userRepository;
    @Mock
    private CalculateTargetsUseCase calculateTargets;
    @InjectMocks
    private UserProfileService service;

    @Test
    void updateProfileAplicaMetasCalculadasESalva() {
        User existing = User.builder().id(USER_ID).tenantId(TENANT_ID).email("ana@vitalpair.app").name("antigo").build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(calculateTargets.calculate(any())).thenReturn(new TdeeResult(1395, 1918, 1418, 130, 107, 52));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileCommand command = new UpdateProfileCommand(
                "Ana", LocalDate.of(1999, 5, 20), Sex.FEMALE,
                BigDecimal.valueOf(165), BigDecimal.valueOf(65),
                Goal.LOSE_WEIGHT, ActivityLevel.LIGHT, null);

        User result = service.updateProfile(USER_ID, command);

        assertThat(result.getName()).isEqualTo("Ana");
        assertThat(result.getGoal()).isEqualTo(Goal.LOSE_WEIGHT);
        assertThat(result.getDailyCalorieTarget()).isEqualTo(1418);
        assertThat(result.getProteinTargetG()).isEqualTo(130);
        assertThat(result.getCarbTargetG()).isEqualTo(107);
        assertThat(result.getFatTargetG()).isEqualTo(52);
    }

    @Test
    void getTdeeComPerfilIncompletoLancaErro() {
        User incompleto = User.builder().id(USER_ID).email("ana@vitalpair.app").name("Ana").build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(incompleto));

        assertThatThrownBy(() -> service.getTdee(USER_ID))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void getProfileInexistenteLancaNotFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProfile(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
