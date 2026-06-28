package com.aps.vitalpair.progress.infrastructure.web;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RecordWeightRequest(
        @NotNull @Positive @DecimalMax("999.99") BigDecimal weightKg) {
}
