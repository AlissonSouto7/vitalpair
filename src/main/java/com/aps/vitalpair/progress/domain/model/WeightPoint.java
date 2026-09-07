package com.aps.vitalpair.progress.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One point of the weight history: the weight recorded on a date.
 *
 * @param date     the day
 * @param weightKg the weight in kilograms
 */
public record WeightPoint(LocalDate date, BigDecimal weightKg) {}
