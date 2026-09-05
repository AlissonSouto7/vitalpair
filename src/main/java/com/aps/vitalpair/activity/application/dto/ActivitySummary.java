package com.aps.vitalpair.activity.application.dto;

import java.time.LocalDate;

/** Resumo de atividade do dia. */
public record ActivitySummary(LocalDate date, int totalCaloriesBurned, int totalSteps, int activityCount) {}
