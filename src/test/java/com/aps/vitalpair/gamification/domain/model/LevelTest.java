package com.aps.vitalpair.gamification.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * A curva de nível.
 *
 * <p>Ela vivia no navegador e passou para cá, então a primeira coisa que estes testes fazem é
 * garantir que ninguém muda de nível na virada: os mesmos pontos têm de dar o mesmo número.
 *
 * <p>A fronteira é o que importa. Um erro de um ponto para cada lado não quebra nada
 * visivelmente e muda o nível de todo mundo que está perto de subir, que é justamente quem
 * está olhando a barra.
 */
class LevelTest {

    @ParameterizedTest(name = "{0} pontos é nível {1}")
    @CsvSource({
        "0, 1",
        "149, 1",
        "150, 2",
        "399, 2",
        "400, 3",
        "799, 3",
        "800, 4",
        "1399, 4",
        "1400, 5",
        "2199, 5",
        "2200, 6",
        "3199, 6",
        "3200, 7",
        "4499, 7",
        "4500, 8",
        "5999, 8",
        "6000, 9",
        "7500, 10"
    })
    @DisplayName("the curve matches the one that was in the browser, threshold by threshold")
    void theCurveMatchesTheOneFromTheBrowser(long pontos, int nivelEsperado) {
        assertThat(Level.of(pontos).level()).isEqualTo(nivelEsperado);
    }

    @Test
    @DisplayName("says how much is left, which is the number that makes somebody log one more thing")
    void saysHowMuchIsLeft() {
        Level nivel = Level.of(300);

        // 300 pontos: nível 2 (abre em 150), o 3 abre em 400.
        assertThat(nivel.level()).isEqualTo(2);
        assertThat(nivel.pointsToNext()).isEqualTo(100);
        assertThat(nivel.nextThreshold()).isEqualTo(400);
    }

    @Test
    @DisplayName("the bar measures the level being walked, not the whole journey")
    void theBarMeasuresTheCurrentLevel() {
        // Metade do caminho entre 150 e 400 é 275.
        assertThat(Level.of(275).percent()).isEqualTo(50);
        // Quem acabou de subir está no começo do nível novo, não no fim do anterior.
        assertThat(Level.of(150).percent()).isZero();
        assertThat(Level.of(399).percent()).isEqualTo(100);
    }

    @Test
    @DisplayName("nobody starts at zero percent of nothing")
    void somebodyWithNoPointsIsLevelOneAtZero() {
        Level zero = Level.of(0);

        assertThat(zero.level()).isEqualTo(1);
        assertThat(zero.points()).isZero();
        assertThat(zero.percent()).isZero();
        assertThat(zero.pointsToNext()).isEqualTo(150);
    }

    @Test
    @DisplayName("a negative total is treated as zero instead of a negative level")
    void aNegativeTotalIsTreatedAsZero() {
        // Não existe hoje, porque o ledger só soma. Se um estorno existir um dia, o nível não
        // pode virar zero ou negativo por causa dele.
        assertThat(Level.of(-500).level()).isEqualTo(1);
        assertThat(Level.of(-500).percent()).isZero();
    }

    @Test
    @DisplayName("past the handmade thresholds each level costs the same")
    void pastTheHandmadeThresholdsEachLevelCostsTheSame() {
        // Do nono em diante: 4500 + 1500 por nível.
        assertThat(Level.of(6000).level()).isEqualTo(9);
        assertThat(Level.of(7500).level()).isEqualTo(10);
        assertThat(Level.of(9000).level()).isEqualTo(11);
        assertThat(Level.of(7499).level()).isEqualTo(9);
    }

    @Test
    @DisplayName("the level stops climbing instead of running away with the number")
    void theLevelStopsClimbing() {
        Level absurdo = Level.of(100_000_000L);

        assertThat(absurdo.level()).isEqualTo(99);
        // No topo não há próximo nível, e a barra não pode ficar dividindo por zero.
        assertThat(absurdo.percent()).isEqualTo(100);
    }
}
