package com.aps.vitalpair.gamification.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import com.aps.vitalpair.user.domain.model.Goal;

/**
 * As medalhas de peso, medidas na direção do objetivo de cada um.
 *
 * <p>Este produto existe para um casal com metas opostas, então a regra não pode ser "perdeu
 * X kg": premiar a perda puniria quem está ganhando massa de propósito, e é metade do público
 * do aplicativo. A mesma lógica já vive na tela de progresso, em {@code weightVerdict}, que
 * decide se o número é boa notícia lendo o objetivo da pessoa; aqui ela decide a medalha.
 *
 * <p>Quem escolheu MANTER é premiado pelo contrário: por não ter se movido. E quem não disse o
 * objetivo não ganha nada, porque o aplicativo não sabe para que lado torcer e inventar um
 * lado seria decidir o corpo da pessoa por ela.
 */
class WeightMilestoneTest {

    private static List<String> badges(double from, double to, Goal goal) {
        return WeightMilestone.badgesFor(BigDecimal.valueOf(from), BigDecimal.valueOf(to), goal);
    }

    /** O degrau mais alto atingido, que é o que a escada "chegou até aqui" significa. */
    private static String top(double from, double to, Goal goal) {
        List<String> earned = badges(from, to, goal);
        return earned.isEmpty() ? null : earned.get(earned.size() - 1);
    }

    @ParameterizedTest(name = "perder peso, de {0} para {1} kg, dá {2}")
    @CsvSource({
        "80, 79.5, ", // meio quilo: abaixo do primeiro degrau
        "80, 79, WEIGHT_FIRST_KILO",
        "80, 77, WEIGHT_THREE_KILOS",
        "80, 73, WEIGHT_SEVEN_KILOS",
        "80, 70, WEIGHT_SEVEN_KILOS", // passou do último: continua o último
        "80, 81, " // andou para o outro lado
    })
    @DisplayName("losing weight is measured downwards")
    void losingWeightIsMeasuredDownwards(double from, double to, String expected) {
        assertThat(top(from, to, Goal.LOSE_WEIGHT)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "ganhar massa, de {0} para {1} kg, dá {2}")
    @CsvSource({
        "55, 55.5, ",
        "55, 56, WEIGHT_FIRST_KILO",
        "55, 58, WEIGHT_THREE_KILOS",
        "55, 62, WEIGHT_SEVEN_KILOS",
        "55, 54, " // perder peso não é progresso para quem quer ganhar
    })
    @DisplayName("gaining muscle is the same ladder, pointing the other way")
    void gainingMuscleIsTheSameLadderPointingTheOtherWay(double from, double to, String expected) {
        assertThat(top(from, to, Goal.GAIN_MUSCLE)).isEqualTo(expected);
    }

    @Test
    @DisplayName("the same two numbers earn opposite verdicts for the two people in a pair")
    void theSameTwoNumbersEarnOppositeVerdictsForAPair() {
        // É o caso que define o produto: a mesma variação, lida dos dois lados.
        assertThat(badges(80, 77, Goal.LOSE_WEIGHT)).contains("WEIGHT_THREE_KILOS");
        assertThat(badges(80, 77, Goal.GAIN_MUSCLE)).isEmpty();

        assertThat(badges(55, 58, Goal.GAIN_MUSCLE)).contains("WEIGHT_THREE_KILOS");
        assertThat(badges(55, 58, Goal.LOSE_WEIGHT)).isEmpty();
    }

    @Test
    @DisplayName("keeping the weight is rewarded for not moving")
    void keepingTheWeightIsRewardedForNotMoving() {
        // Para quem escolheu manter, mover é o problema e ficar é a conquista.
        assertThat(badges(70, 70.4, Goal.MAINTAIN)).containsExactly("WEIGHT_STEADY");
        assertThat(badges(70, 69.6, Goal.MAINTAIN)).containsExactly("WEIGHT_STEADY");
        assertThat(badges(70, 72, Goal.MAINTAIN)).isEmpty();
        assertThat(badges(70, 68, Goal.MAINTAIN)).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(
            value = Goal.class,
            names = {"IMPROVE_FITNESS"})
    @DisplayName("without a direction the app awards nothing rather than guessing one")
    void withoutADirectionTheAppAwardsNothing(Goal goal) {
        assertThat(badges(80, 73, goal)).isEmpty();
        assertThat(badges(80, 87, goal)).isEmpty();
    }

    @Test
    @DisplayName("no goal at all is the same silence")
    void noGoalAtAllIsTheSameSilence() {
        assertThat(badges(80, 70, null)).isEmpty();
    }

    @Test
    @DisplayName("a missing starting weight earns nothing, instead of counting from zero")
    void aMissingStartingWeightEarnsNothing() {
        // Sem a primeira pesagem não há variação a medir. Tratar o nulo como zero daria uma
        // "perda" de 80 kg na primeira vez que alguém se pesasse.
        assertThat(WeightMilestone.badgesFor(null, BigDecimal.valueOf(73), Goal.LOSE_WEIGHT))
                .isEmpty();
        assertThat(WeightMilestone.badgesFor(BigDecimal.valueOf(80), null, Goal.LOSE_WEIGHT))
                .isEmpty();
    }

    @Test
    @DisplayName("every step reached is earned, so a jump leaves no hole in the collection")
    void everyStepReachedIsEarned() {
        /*
         * Só o degrau mais alto era devolvido, e isso furava a coleção de quem se move em
         * saltos. A API aceita uma pesagem por dia: quem passa duas semanas sem se pesar e
         * volta sete quilos adiante ganhava a medalha de sete e nunca a do primeiro quilo,
         * que também conquistou. As menores não "já foram concedidas no caminho" quando não
         * houve caminho registrado.
         */
        assertThat(badges(80, 73, Goal.LOSE_WEIGHT))
                .containsExactly("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS");

        // E um degrau de cada vez continua dando um de cada vez.
        assertThat(badges(80, 79, Goal.LOSE_WEIGHT)).containsExactly("WEIGHT_FIRST_KILO");
        assertThat(badges(80, 77, Goal.LOSE_WEIGHT)).containsExactly("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS");
    }

    @Test
    @DisplayName("exactly on a threshold counts, because a kilo is a kilo")
    void exactlyOnAThresholdCounts() {
        assertThat(badges(80, 79, Goal.LOSE_WEIGHT)).contains("WEIGHT_FIRST_KILO");
        assertThat(badges(80, 77, Goal.LOSE_WEIGHT)).contains("WEIGHT_THREE_KILOS");
        assertThat(badges(80, 73, Goal.LOSE_WEIGHT)).contains("WEIGHT_SEVEN_KILOS");
    }
}
