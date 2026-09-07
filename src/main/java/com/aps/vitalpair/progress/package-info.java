/**
 * Feature <b>progress</b>: the Progress screen. Weight history ({@code weight_logs}), calories
 * consumed against the target over the last 7 days, and the last 7 days' macro averages.
 *
 * <p>Weight is persisted here (one record per day, upserted). Calories and macros are read-only
 * aggregates of {@code food_logs} (the nutrition feature); the targets come from the profile
 * (the user and tdee features). Dependency rule: infrastructure -> application -> domain.
 */
package com.aps.vitalpair.progress;
