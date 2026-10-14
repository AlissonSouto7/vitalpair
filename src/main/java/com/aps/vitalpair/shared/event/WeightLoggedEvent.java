package com.aps.vitalpair.shared.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Published when a weight is recorded. Consumed by gamification, to award the weight badges.
 *
 * <p>It carries both ends of the comparison because the badge depends on the change rather
 * than on the number: the first weight on record is where the person started, and a consumer
 * that had to fetch it would need the progress feature's repository, which it has no business
 * knowing about.
 *
 * <p>No points and no feed item. A weighing is not an effort the way a meal or a workout is,
 * and paying for it would reward standing on a scale ten times a day.
 *
 * @param startWeightKg the earliest weight on record for this user, or null on the very first
 *     weighing, when there is no change to measure yet
 * @param weightKg the weight just recorded
 */
public record WeightLoggedEvent(
        UUID userId, UUID tenantId, LocalDate date, BigDecimal startWeightKg, BigDecimal weightKg) {}
