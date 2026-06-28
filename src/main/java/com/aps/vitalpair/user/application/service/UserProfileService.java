package com.aps.vitalpair.user.application.service;

import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.tdee.domain.model.TdeeInput;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import com.aps.vitalpair.tdee.domain.port.in.CalculateTargetsUseCase;
import com.aps.vitalpair.user.application.dto.UpdateProfileCommand;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.in.GetProfileUseCase;
import com.aps.vitalpair.user.domain.port.in.GetTdeeUseCase;
import com.aps.vitalpair.user.domain.port.in.UpdateProfileUseCase;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;
import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso do perfil do usuário. Ao atualizar o perfil, recalcula automaticamente a meta
 * calórica e os macros via {@link CalculateTargetsUseCase} (feature tdee).
 */
@Service
public class UserProfileService implements GetProfileUseCase, UpdateProfileUseCase, GetTdeeUseCase {

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
        return userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
    }

    @Override
    @Transactional
    public User updateProfile(UUID userId, UpdateProfileCommand command) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        TdeeResult targets = calculateTargets.calculate(new TdeeInput(
                command.sex(),
                ageFrom(command.birthDate()),
                command.heightCm(),
                command.weightKg(),
                command.activityLevel(),
                command.goal()));

        User updated = user.toBuilder()
                .name(command.name())
                .birthDate(command.birthDate())
                .sex(command.sex())
                .heightCm(command.heightCm())
                .weightKg(command.weightKg())
                .goal(command.goal())
                .activityLevel(command.activityLevel())
                .avatarUrl(command.avatarUrl())
                .dailyCalorieTarget(targets.dailyCalorieTarget())
                .proteinTargetG(targets.proteinTargetG())
                .carbTargetG(targets.carbTargetG())
                .fatTargetG(targets.fatTargetG())
                .build();

        User saved = userRepository.save(updated);

        // Mudar o peso no perfil vira um ponto no histórico (weight_logs de hoje, upsert).
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
}
