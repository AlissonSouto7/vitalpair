package com.aps.vitalpair.user.application.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.tdee.domain.model.TdeeInput;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import com.aps.vitalpair.tdee.domain.port.in.CalculateTargetsUseCase;
import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Mascot;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.ChooseMascotUseCase;
import com.aps.vitalpair.user.domain.port.in.GetProfileUseCase;
import com.aps.vitalpair.user.domain.port.in.GetTdeeUseCase;
import com.aps.vitalpair.user.domain.port.in.UpdateProfileUseCase;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Use cases of the user profile. Updating the profile recomputes the calorie target and the
 * macros through {@link CalculateTargetsUseCase} (the tdee feature).
 */
@Service
public class UserProfileService
        implements GetProfileUseCase, UpdateProfileUseCase, GetTdeeUseCase, ChooseMascotUseCase {

    private final UserRepositoryPort userRepository;
    private final CalculateTargetsUseCase calculateTargets;
    private final RecordWeightUseCase recordWeight;

    public UserProfileService(
            UserRepositoryPort userRepository,
            CalculateTargetsUseCase calculateTargets,
            RecordWeightUseCase recordWeight) {
        this.userRepository = userRepository;
        this.calculateTargets = calculateTargets;
        this.recordWeight = recordWeight;
    }

    @Override
    @Transactional(readOnly = true)
    public User getProfile(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
    }

    @Override
    @Transactional
    public User updateProfile(UUID userId, UpdateProfileCommand command) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        TdeeResult targets = calculateTargets.calculate(new TdeeInput(
                command.sex(),
                ageFrom(command.birthDate()),
                command.heightCm(),
                command.weightKg(),
                command.activityLevel(),
                command.goal()));

        BigDecimal alvo = resolveTargetWeight(command, user);

        User updated = user.toBuilder()
                .name(command.name())
                .birthDate(command.birthDate())
                .sex(command.sex())
                .heightCm(command.heightCm())
                .weightKg(command.weightKg())
                .targetWeightKg(alvo)
                .goal(command.goal())
                .activityLevel(command.activityLevel())
                // Same rule as the zone below, and it was missing here. The photo is set by its
                // own endpoint and no screen sends this field, so every profile save arrived with
                // it null and wiped the photo: measured on a running server, set the avatar, save
                // the form once, avatar gone. A partial update must not clear what it does not
                // mention.
                .avatarUrl(command.avatarUrl() != null ? command.avatarUrl() : user.getAvatarUrl())
                // Absent means "leave it alone", not "clear it": every other field on this form
                // is required, so a client that omits the zone is one that does not know about
                // it yet, and it must not wipe a preference the person set elsewhere.
                .timeZone(command.timeZone() != null ? command.timeZone() : user.getTimeZone())
                .dailyCalorieTarget(targets.dailyCalorieTarget())
                .proteinTargetG(targets.proteinTargetG())
                .carbTargetG(targets.carbTargetG())
                .fatTargetG(targets.fatTargetG())
                .build();

        User saved = userRepository.save(updated);

        // Changing the weight in the profile becomes a history point (today's weight_logs row, upserted).
        if (saved.getWeightKg() != null) {
            recordWeight.recordTodayWeight(saved.getId(), saved.getWeightKg());
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public TdeeResult getTdee(UUID userId) {
        User user = getProfile(userId);
        requireCompleteProfile(user);
        return calculateTargets.calculate(new TdeeInput(
                user.getSex(),
                ageFrom(user.getBirthDate()),
                user.getHeightCm(),
                user.getWeightKg(),
                user.getActivityLevel(),
                user.getGoal()));
    }

    /**
     * O peso que a pessoa quer atingir, quando ele faz sentido.
     *
     * <p>Ausente quer dizer "deixa como está", pela mesma razão do fuso e da foto acima: um
     * cliente que não manda o campo é um cliente que ainda não o conhece, e ele não pode
     * apagar o que a pessoa definiu em outro lugar.
     *
     * <p>Um alvo que contradiz o objetivo é recusado com o motivo, e não corrigido em
     * silêncio: quem quer perder peso e digita um alvo maior que o atual provavelmente
     * trocou os números de lugar, e o aplicativo escolher por ela daria um objetivo que ela
     * não pediu. Manter o peso e melhorar o condicionamento não têm alvo de peso, então um
     * valor ali é uma pergunta que nunca foi feita: some junto com o objetivo.
     */
    private BigDecimal resolveTargetWeight(UpdateProfileCommand command, User user) {
        BigDecimal pedido = command.targetWeightKg() != null ? command.targetWeightKg() : user.getTargetWeightKg();
        if (pedido == null) {
            return null;
        }
        Goal objetivo = command.goal();
        if (objetivo == Goal.MAINTAIN || objetivo == Goal.IMPROVE_FITNESS) {
            return null;
        }
        BigDecimal atual = command.weightKg();
        if (objetivo == Goal.LOSE_WEIGHT && pedido.compareTo(atual) >= 0) {
            throw new BusinessRuleException("Pra perder peso, o alvo precisa ser menor que seu peso de hoje.");
        }
        if (objetivo == Goal.GAIN_MUSCLE && pedido.compareTo(atual) <= 0) {
            throw new BusinessRuleException("Pra ganhar massa, o alvo precisa ser maior que seu peso de hoje.");
        }
        return pedido;
    }

    private int ageFrom(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private void requireCompleteProfile(User user) {
        boolean incomplete = user.getBirthDate() == null
                || user.getSex() == null
                || user.getHeightCm() == null
                || user.getWeightKg() == null
                || user.getActivityLevel() == null
                || user.getGoal() == null;
        if (incomplete) {
            throw new BusinessRuleException(
                    "Complete seu perfil (nascimento, sexo, altura, peso, nível de atividade e objetivo) para calcular o TDEE");
        }
    }

    /**
     * Grava a aparência escolhida para o mascote.
     *
     * <p>Só este campo muda. O mascote era decidido pelo papel no par, dentro do componente
     * de desenho: quem era "você" recebia um rosto e o par recebia o outro, sem escolha. A
     * primeira usuária do app marcou sexo feminino, viu o rosto masculino e perguntou como
     * trocar.
     */
    @Override
    @Transactional
    public void chooseMascot(UUID userId, Mascot mascot) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        userRepository.save(user.toBuilder().mascot(mascot).build());
    }
}
