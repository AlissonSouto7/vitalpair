package com.aps.vitalpair.gamification.domain.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.aps.vitalpair.user.domain.model.Goal;

/**
 * Which weight badge a change in weight has earned, read in the direction of the person's own
 * goal.
 *
 * <p>The obvious rule, "lost 3 kg", is the wrong one here. This product is built for a pair
 * with opposite goals, so a badge for losing weight would punish the half of its users who
 * are deliberately gaining muscle, every time they succeeded. The progress screen already
 * reads a weight change this way, in {@code weightVerdict}, to decide whether the number is
 * good news; this decides the badge from the same principle.
 *
 * <p>Three steps rather than one, because the first kilo is when somebody decides the app
 * works and the seventh is when they tell a friend. Whoever chose to maintain is rewarded for
 * the opposite, for not having moved. Whoever has not said what they want earns nothing: the
 * app does not know which way to cheer, and picking a side would be deciding somebody's body
 * for them.
 */
public final class WeightMilestone {

    /** The ladder, largest first: the answer is the highest step reached. */
    private static final BigDecimal SEVEN = BigDecimal.valueOf(7);

    private static final BigDecimal THREE = BigDecimal.valueOf(3);
    private static final BigDecimal ONE = BigDecimal.ONE;

    /** How far someone who chose to maintain may drift and still count as steady. */
    private static final BigDecimal STEADY_MARGIN = BigDecimal.valueOf(0.5);

    public static final String FIRST_KILO = "WEIGHT_FIRST_KILO";
    public static final String THREE_KILOS = "WEIGHT_THREE_KILOS";
    public static final String SEVEN_KILOS = "WEIGHT_SEVEN_KILOS";
    public static final String STEADY = "WEIGHT_STEADY";

    private WeightMilestone() {}

    /**
     * The badge codes earned by moving from {@code startWeight} to {@code currentWeight},
     * empty when nothing was earned.
     *
     * <p>Every step reached, lowest first. Somebody who weighs in only after a long stretch
     * earned the smaller ones too, and they must not be missing from the collection.
     *
     * @param startWeight the first weight on record, or null when there is only one weighing
     * @param currentWeight the weight just recorded
     * @param goal what the person is training for, or null when they have not said
     */
    public static List<String> badgesFor(BigDecimal startWeight, BigDecimal currentWeight, Goal goal) {
        if (startWeight == null || currentWeight == null || goal == null) {
            // No change to measure. Treating a missing start as zero would read the first
            // weighing of somebody's life as a loss of their entire body weight.
            return List.of();
        }

        BigDecimal delta = currentWeight.subtract(startWeight);

        return switch (goal) {
            case LOSE_WEIGHT -> stepsFor(delta.negate());
            case GAIN_MUSCLE -> stepsFor(delta);
            case MAINTAIN -> delta.abs().compareTo(STEADY_MARGIN) <= 0 ? List.of(STEADY) : List.of();
            case IMPROVE_FITNESS -> List.of();
        };
    }

    /**
     * Every step {@code progress} has reached, where progress is always positive-is-good.
     *
     * <p>All of them, not only the highest. Awarding just the top step leaves a hole in the
     * collection of anybody who moved in jumps: somebody who weighs in after losing seven
     * kilos would get the seven-kilo badge and never the one for the first kilo, which they
     * also did. Awarding is idempotent, so offering a step already held costs nothing.
     */
    private static List<String> stepsFor(BigDecimal progress) {
        List<String> earned = new ArrayList<>(3);
        if (progress.compareTo(ONE) >= 0) {
            earned.add(FIRST_KILO);
        }
        if (progress.compareTo(THREE) >= 0) {
            earned.add(THREE_KILOS);
        }
        if (progress.compareTo(SEVEN) >= 0) {
            earned.add(SEVEN_KILOS);
        }
        return earned;
    }
}
