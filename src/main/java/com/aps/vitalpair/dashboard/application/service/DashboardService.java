package com.aps.vitalpair.dashboard.application.service;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;
import com.aps.vitalpair.activity.domain.port.in.GetActivitySummaryUseCase;
import com.aps.vitalpair.dashboard.domain.model.DashboardView;
import com.aps.vitalpair.dashboard.domain.model.DayProgress;
import com.aps.vitalpair.dashboard.domain.model.PartnerSummary;
import com.aps.vitalpair.dashboard.domain.port.in.GetDashboardUseCase;
import com.aps.vitalpair.nutrition.application.dto.DailySummary;
import com.aps.vitalpair.nutrition.domain.port.in.GetDailySummaryUseCase;
import com.aps.vitalpair.pair.application.dto.MemberView;
import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.port.in.GetCurrentPairUseCase;

/**
 * Builds the daily dashboard from nutrition (consumed), activity (burned) and the user's target,
 * plus the partner's short summary. Net = consumed - burned; remaining = target - net.
 */
@Service
public class DashboardService implements GetDashboardUseCase {

    private final GetDailySummaryUseCase nutritionSummary;
    private final GetActivitySummaryUseCase activitySummary;
    private final GetCurrentPairUseCase currentPair;

    public DashboardService(
            GetDailySummaryUseCase nutritionSummary,
            GetActivitySummaryUseCase activitySummary,
            GetCurrentPairUseCase currentPair) {
        this.nutritionSummary = nutritionSummary;
        this.activitySummary = activitySummary;
        this.currentPair = currentPair;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardView getDashboard(UUID userId, LocalDate date) {
        DayProgress me = buildProgress(userId, date);
        PartnerSummary partner = resolvePartner(userId, date);
        return new DashboardView(date, me, partner);
    }

    private DayProgress buildProgress(UUID userId, LocalDate date) {
        DailySummary nutrition = nutritionSummary.getSummary(userId, date);
        ActivitySummary activity = activitySummary.getSummary(userId, date);

        int net = nutrition.consumedCalories() - activity.totalCaloriesBurned();
        Integer remaining = nutrition.targetCalories() != null ? nutrition.targetCalories() - net : null;

        return new DayProgress(
                nutrition.targetCalories(),
                nutrition.consumedCalories(),
                activity.totalCaloriesBurned(),
                net,
                remaining,
                nutrition.consumedProteinG(),
                nutrition.consumedCarbG(),
                nutrition.consumedFatG(),
                nutrition.targetProteinG(),
                nutrition.targetCarbG(),
                nutrition.targetFatG(),
                activity.totalSteps(),
                nutrition.mealCount());
    }

    private PartnerSummary resolvePartner(UUID userId, LocalDate date) {
        PairView pair = currentPair.getCurrentPair(userId);
        MemberView partner = pair.members().stream()
                .filter(member -> !member.userId().equals(userId))
                .findFirst()
                .orElse(null);
        if (partner == null) {
            return null;
        }

        DailySummary nutrition = nutritionSummary.getSummary(partner.userId(), date);
        ActivitySummary activity = activitySummary.getSummary(partner.userId(), date);
        int net = nutrition.consumedCalories() - activity.totalCaloriesBurned();

        return new PartnerSummary(
                partner.userId(),
                partner.name(),
                partner.avatarUrl(),
                nutrition.targetCalories(),
                nutrition.consumedCalories(),
                activity.totalCaloriesBurned(),
                net);
    }
}
