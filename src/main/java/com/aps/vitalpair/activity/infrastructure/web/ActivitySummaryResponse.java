package com.aps.vitalpair.activity.infrastructure.web;

import java.time.LocalDate;

import com.aps.vitalpair.activity.application.dto.ActivitySummary;

public record ActivitySummaryResponse(LocalDate date, int totalCaloriesBurned, int totalSteps, int activityCount) {

    public static ActivitySummaryResponse from(ActivitySummary s) {
        return new ActivitySummaryResponse(s.date(), s.totalCaloriesBurned(), s.totalSteps(), s.activityCount());
    }
}
