package com.aps.vitalpair.tdee.application.service;

import org.springframework.stereotype.Service;

import com.aps.vitalpair.tdee.domain.model.TdeeInput;
import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import com.aps.vitalpair.tdee.domain.port.in.CalculateTargetsUseCase;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;
import com.aps.vitalpair.user.domain.model.Sex;

/**
 * TDEE by the Mifflin-St Jeor formula, and the calorie target and macro split by goal (see
 * docs/features/user-profile.md for the constants).
 */
@Service
public class TdeeService implements CalculateTargetsUseCase {

    private static final int CALORIES_PER_GRAM_PROTEIN = 4;
    private static final int CALORIES_PER_GRAM_CARB = 4;
    private static final int CALORIES_PER_GRAM_FAT = 9;

    @Override
    public TdeeResult calculate(TdeeInput input) {
        double weight = input.weightKg().doubleValue();
        double height = input.heightCm().doubleValue();

        double bmr = (10 * weight) + (6.25 * height) - (5 * input.age()) + sexConstant(input.sex());
        double tdee = bmr * activityMultiplier(input.activityLevel());
        double dailyCalories = tdee + goalCalorieAdjustment(input.goal());

        int proteinG = (int) Math.round(weight * proteinPerKg(input.goal()));
        int fatG = (int) Math.round(weight * fatPerKg(input.goal()));
        int remainingCalories = (int) Math.round(dailyCalories)
                - (proteinG * CALORIES_PER_GRAM_PROTEIN)
                - (fatG * CALORIES_PER_GRAM_FAT);
        int carbG = Math.max(0, remainingCalories / CALORIES_PER_GRAM_CARB);

        return new TdeeResult(
                (int) Math.round(bmr), (int) Math.round(tdee), (int) Math.round(dailyCalories), proteinG, carbG, fatG);
    }

    /**
     * The sex constant of Mifflin-St Jeor.
     *
     * <p>The formula defines only two, so OTHER takes their midpoint: the honest answer for
     * somebody it was not written for, rather than quietly filing them under one.
     */
    private double sexConstant(Sex sex) {
        return switch (sex) {
            case MALE -> 5;
            case FEMALE -> -161;
            case OTHER -> -78;
        };
    }

    private double activityMultiplier(ActivityLevel level) {
        return switch (level) {
            case SEDENTARY -> 1.2;
            case LIGHT -> 1.375;
            case MODERATE -> 1.55;
            case ACTIVE -> 1.725;
            case VERY_ACTIVE -> 1.9;
        };
    }

    private double goalCalorieAdjustment(Goal goal) {
        return switch (goal) {
            case LOSE_WEIGHT -> -500;
            case GAIN_MUSCLE -> 300;
            case MAINTAIN, IMPROVE_FITNESS -> 0;
        };
    }

    private double proteinPerKg(Goal goal) {
        return switch (goal) {
            case LOSE_WEIGHT -> 2.0;
            case GAIN_MUSCLE -> 2.2;
            case MAINTAIN, IMPROVE_FITNESS -> 1.8;
        };
    }

    private double fatPerKg(Goal goal) {
        return switch (goal) {
            case LOSE_WEIGHT -> 0.8;
            case GAIN_MUSCLE -> 1.0;
            case MAINTAIN, IMPROVE_FITNESS -> 0.9;
        };
    }
}
