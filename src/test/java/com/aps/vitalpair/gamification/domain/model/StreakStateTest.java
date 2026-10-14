package com.aps.vitalpair.gamification.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Quando a sequência está a um dia de quebrar.
 *
 * <p>A regra que isto espelha é a de {@code StreakService.registerActivity}: a sequência só
 * continua quando o registro novo cai exatamente no dia seguinte ao último
 * ({@code last.equals(date.minusDays(1))}). Qualquer outro intervalo reinicia em 1.
 *
 * <p>Daí sair daqui e não do navegador: "hoje" é no fuso da pessoa, que o servidor conhece e
 * o dispositivo não. Quem viaja, ou deixou o telefone em outro fuso, veria o aviso no dia
 * errado, e um aviso de urgência no dia errado é pior que nenhum.
 */
class StreakStateTest {

    private static final LocalDate HOJE = LocalDate.of(2026, 10, 14);

    private static UserStreak streak(int count, LocalDate last) {
        return UserStreak.builder()
                .type(StreakType.NUTRITION_LOG)
                .currentCount(count)
                .longestCount(count)
                .lastActivityDate(last)
                .build();
    }

    @Test
    @DisplayName("the last record was yesterday: today is the day it breaks")
    void lastRecordWasYesterdaySoTodayIsTheDayItBreaks() {
        StreakState state = StreakState.of(streak(5, HOJE.minusDays(1)), HOJE);

        assertThat(state.breaksToday()).isTrue();
        assertThat(state.recordedToday()).isFalse();
    }

    @Test
    @DisplayName("already recorded today: nothing is at risk")
    void alreadyRecordedTodayNothingIsAtRisk() {
        StreakState state = StreakState.of(streak(6, HOJE), HOJE);

        assertThat(state.breaksToday()).isFalse();
        assertThat(state.recordedToday()).isTrue();
    }

    @Test
    @DisplayName("the streak is already gone, so there is nothing left to warn about")
    void anAlreadyBrokenStreakWarnsAboutNothing() {
        // Dois dias atrás: a sequência já quebrou e vale 1 no próximo registro. Avisar que
        // "vai quebrar hoje" seria mentir sobre algo que já aconteceu.
        StreakState state = StreakState.of(streak(5, HOJE.minusDays(2)), HOJE);

        assertThat(state.breaksToday()).isFalse();
        assertThat(state.recordedToday()).isFalse();
    }

    @Test
    @DisplayName("a streak of one that was fed yesterday is still worth saving")
    void aStreakOfOneFedYesterdayIsStillWorthSaving() {
        // Um dia é uma sequência: amanhã vale dois. O aviso serve justamente para quem está
        // começando, que é quem desiste.
        StreakState state = StreakState.of(streak(1, HOJE.minusDays(1)), HOJE);

        assertThat(state.breaksToday()).isTrue();
    }

    @Test
    @DisplayName("a streak at zero is not a streak, whatever the date says")
    void aStreakAtZeroIsNotAStreak() {
        assertThat(StreakState.of(streak(0, HOJE.minusDays(1)), HOJE).breaksToday())
                .isFalse();
    }

    @Test
    @DisplayName("a streak that never recorded anything carries no date and no warning")
    void aStreakWithNoDateCarriesNoWarning() {
        StreakState state = StreakState.of(streak(0, null), HOJE);

        assertThat(state.breaksToday()).isFalse();
        assertThat(state.recordedToday()).isFalse();
    }

    @Test
    @DisplayName("a date in the future is not treated as yesterday")
    void aDateInTheFutureIsNotTreatedAsYesterday() {
        // Não deveria existir, porque nada grava no futuro. Se existir, por fuso ou por
        // correção manual, "vai quebrar hoje" é falso e não pode ser mostrado.
        StreakState state = StreakState.of(streak(3, HOJE.plusDays(1)), HOJE);

        assertThat(state.breaksToday()).isFalse();
        assertThat(state.recordedToday()).isFalse();
    }
}
