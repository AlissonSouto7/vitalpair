package com.aps.vitalpair.gamification.application.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.aps.vitalpair.gamification.application.dto.WeekResult.Outcome;
import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

/**
 * Uma semana do placar, lida do lado de quem pergunta.
 *
 * <p>A linha gravada tem {@code user1Score} e {@code user2Score}, que são posições do par e
 * não pessoas. O painel descobria qual era a sua comparando o próprio id com o primeiro item
 * da lista de membros, e cada tela que lê o placar carregava uma cópia desse raciocínio.
 * Resolver aqui é o que impede uma tela de mostrar os dois números trocados.
 */
class WeekResultTest {

    private static final UUID ANA = UUID.randomUUID();
    private static final UUID CELIA = UUID.randomUUID();
    private static final LocalDate WEEK = LocalDate.of(2026, 10, 5);

    /** Uma semana em que a user1 (Ana) fez 120 e a user2 (Célia) fez 80. */
    private static CompetitionScore week(int user1, int user2) {
        return CompetitionScore.builder()
                .weekStart(WEEK)
                .user1Score(user1)
                .user2Score(user2)
                .build();
    }

    @Test
    @DisplayName("the same week reads as a win for one and a loss for the other")
    void theSameWeekReadsAsAWinForOneAndALossForTheOther() {
        // É o caso que o defeito produzia ao contrário: duas telas, dois raciocínios, e nada
        // garantindo que a lista de membros tivesse a ordem do par gravado.
        CompetitionScore score = week(120, 80);

        WeekResult forAna = WeekResult.of(score, ANA, ANA);
        assertThat(forAna.yours()).isEqualTo(120);
        assertThat(forAna.theirs()).isEqualTo(80);
        assertThat(forAna.outcome()).isEqualTo(Outcome.WON);

        WeekResult forCelia = WeekResult.of(score, ANA, CELIA);
        assertThat(forCelia.yours()).isEqualTo(80);
        assertThat(forCelia.theirs()).isEqualTo(120);
        assertThat(forCelia.outcome()).isEqualTo(Outcome.LOST);
    }

    @Test
    @DisplayName("equal points is a tie for both, not a loss for either")
    void equalPointsIsATieForBoth() {
        CompetitionScore score = week(90, 90);

        assertThat(WeekResult.of(score, ANA, ANA).outcome()).isEqualTo(Outcome.TIED);
        assertThat(WeekResult.of(score, ANA, CELIA).outcome()).isEqualTo(Outcome.TIED);
    }

    @Test
    @DisplayName("a week nobody scored in is a tie at zero, not a win")
    void aWeekNobodyScoredInIsATieAtZero() {
        // Acontece de verdade: a semana em que o par viajou, ou apenas não registrou nada.
        WeekResult result = WeekResult.of(week(0, 0), ANA, ANA);

        assertThat(result.outcome()).isEqualTo(Outcome.TIED);
        assertThat(result.yours()).isZero();
        assertThat(result.theirs()).isZero();
    }

    @Test
    @DisplayName("the outcome comes from the two numbers, not from the stored winner")
    void theOutcomeComesFromTheTwoNumbers() {
        // Os dois números são o fato; winnerId é uma conclusão que alguém guardou junto. Hoje
        // os dois concordam (medido no banco local: 0 divergências em 30 linhas), e é
        // justamente por isso que vale fixar qual deles decide. O dia em que divergirem, por
        // uma correção manual ou por um caminho de escrita novo, a tela mostra os pontos que
        // a pessoa vê somados, e não um vencedor que contradiz a própria coluna ao lado.
        CompetitionScore inconsistent = week(50, 70).toBuilder().winnerId(ANA).build();

        assertThat(WeekResult.of(inconsistent, ANA, ANA).outcome()).isEqualTo(Outcome.LOST);
        assertThat(WeekResult.of(inconsistent, ANA, CELIA).outcome()).isEqualTo(Outcome.WON);
    }

    @Test
    @DisplayName("somebody who is not in the pair is read as the second side rather than crashing")
    void somebodyWhoIsNotInThePairIsReadAsTheSecondSide() {
        // Não deveria chegar aqui, porque o chamador é autenticado e pertence ao tenant. Se
        // chegar, devolver um número é melhor que estourar numa tela de histórico.
        WeekResult result = WeekResult.of(week(120, 80), ANA, UUID.randomUUID());

        assertThat(result.yours()).isEqualTo(80);
        assertThat(result.theirs()).isEqualTo(120);
    }
}
