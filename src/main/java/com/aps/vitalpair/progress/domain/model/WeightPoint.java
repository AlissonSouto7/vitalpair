package com.aps.vitalpair.progress.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Um ponto do histórico de peso: o peso registrado numa data.
 *
 * @param date     dia do registro
 * @param weightKg peso em quilos
 */
public record WeightPoint(LocalDate date, BigDecimal weightKg) {
}
