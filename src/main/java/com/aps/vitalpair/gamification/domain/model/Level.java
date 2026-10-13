package com.aps.vitalpair.gamification.domain.model;

/**
 * O nível de quem usa, calculado dos pontos que já somou na vida.
 *
 * <p>Vivia no navegador, somado do que a tela de temporada devolvia: temporada atual mais o
 * histórico das fechadas. Isso amarrava o esforço acumulado de meses ao que uma resposta de
 * API escolhe devolver, e bastava o histórico ser paginado para o nível cair. Aqui é somado do
 * ledger, que é append-only e guarda tudo desde o primeiro registro.
 *
 * <p>A curva é a mesma que estava na tela, para ninguém mudar de nível na virada: os oito
 * primeiros são feitos à mão, porque é onde a diferença entre um nível e o seguinte é sentida,
 * e a partir do nono são mil e quinhentos pontos cada.
 *
 * @param level em que nível a pessoa está, de 1 a 99
 * @param points quanto ela somou na vida
 * @param currentThreshold quantos pontos abriram o nível atual
 * @param nextThreshold quantos pontos abrem o próximo
 * @param pointsToNext quanto falta para o próximo, zero no nível máximo
 * @param percent quanto do nível atual já foi andado, de 0 a 100
 */
public record Level(int level, long points, long currentThreshold, long nextThreshold, long pointsToNext, int percent) {

    /** Os pontos que abrem cada um dos oito primeiros níveis. */
    private static final long[] THRESHOLDS = {0, 150, 400, 800, 1400, 2200, 3200, 4500};

    /** Do nono em diante, o passo é fixo. */
    private static final long STEP = 1500;

    /** Depois disto o número perde o sentido, e ninguém chega perto. */
    private static final int MAX_LEVEL = 99;

    public static Level of(long points) {
        long pontos = Math.max(0, points);
        int nivel = 1;
        while (nivel < MAX_LEVEL && pontos >= thresholdFor(nivel + 1)) {
            nivel++;
        }
        long atual = thresholdFor(nivel);
        long proximo = thresholdFor(nivel + 1);
        // No nível máximo não há próximo, e dividir pela diferença daria zero.
        long faixa = Math.max(1, proximo - atual);
        int porcento = (int) Math.round(Math.min(100, Math.max(0, ((pontos - atual) * 100.0) / faixa)));
        return new Level(nivel, pontos, atual, proximo, Math.max(0, proximo - pontos), porcento);
    }

    private static long thresholdFor(int level) {
        if (level <= THRESHOLDS.length) {
            return THRESHOLDS[level - 1];
        }
        return THRESHOLDS[THRESHOLDS.length - 1] + (long) (level - THRESHOLDS.length) * STEP;
    }
}
