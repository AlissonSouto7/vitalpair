package com.aps.vitalpair.mission;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * A missão paga o que promete, uma vez.
 *
 * <p>O catálogo declara quanto cada missão vale desde que existe, a tela mostra "+50 pts" em
 * verde, e nada concedia esses pontos. Medido em 28/09/2026 contra o servidor local: topar a
 * missão de 50 deixava o placar em 25, e a linha "Missões" do resumo da temporada nunca
 * aparecia, porque linhas zeradas dos dois lados são suprimidas.
 *
 * <p>A idempotência mora na chave única do banco, não no código, então só um teste com banco
 * de verdade prova que ela funciona: um mock diria o que eu mandasse dizer.
 */
class MissionRewardIT extends AbstractIntegrationTest {

    /** O placar da temporada, que é somado do ledger. */
    private int placar(Session session) {
        return data(httpGet("/api/v1/season", session))
                .path("you")
                .path("score")
                .asInt();
    }

    /** Quanto o resumo da temporada atribui às missões. Zero quando a linha nem aparece. */
    private int missoesNoResumo(Session session) {
        JsonNode resumo = data(httpGet("/api/v1/season", session)).path("breakdown");
        for (JsonNode linha : resumo) {
            if ("MISSION".equals(linha.path("source").asText())) {
                return linha.path("you").asInt();
            }
        }
        return 0;
    }

    @Test
    @DisplayName("accepting a flash mission pays nothing, because a tap is not the mission")
    void acceptingPaysNothing() {
        Session session = register("SoTopou");
        int antes = placar(session);

        ResponseEntity<String> aceite = httpPost("/api/v1/missions/flash/accept", null, session);

        /*
         * Pagar por aceitar seria pagar por tocar num botão de manhã, e o placar viraria a
         * contagem de toques. A missão relâmpago não é medida pelo aplicativo: ninguém sabe
         * quantos litros de água alguém bebeu.
         */
        assertThat(aceite.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data(aceite).path("accepted").asBoolean()).isTrue();
        assertThat(data(aceite).path("done").asBoolean()).isFalse();
        assertThat(placar(session)).isEqualTo(antes);
    }

    @Test
    @DisplayName("marking it done pays exactly what the card promised")
    void markingItDonePaysWhatWasPromised() {
        Session session = register("Cumpriu");
        int antes = placar(session);
        JsonNode missao = data(httpPost("/api/v1/missions/flash/accept", null, session));
        int prometido = missao.path("reward").asInt();
        assertThat(prometido).isPositive();

        ResponseEntity<String> feito = httpPost("/api/v1/missions/flash/complete", null, session);

        assertThat(feito.getStatusCode()).as(feito.getBody()).isEqualTo(HttpStatus.OK);
        assertThat(data(feito).path("done").asBoolean()).isTrue();
        assertThat(placar(session)).isEqualTo(antes + prometido);
        assertThat(missoesNoResumo(session))
                .as("a linha de missões do resumo, que antes nunca aparecia")
                .isEqualTo(prometido);
    }

    @Test
    @DisplayName("marking it done twice pays once")
    void markingItDoneTwicePaysOnce() {
        Session session = register("DuasVezes");
        httpPost("/api/v1/missions/flash/accept", null, session);
        httpPost("/api/v1/missions/flash/complete", null, session);
        int depoisDaPrimeira = placar(session);

        httpPost("/api/v1/missions/flash/complete", null, session);
        httpPost("/api/v1/missions/flash/complete", null, session);

        assertThat(placar(session)).isEqualTo(depoisDaPrimeira);
    }

    /**
     * Seis confirmações ao mesmo tempo pagam uma.
     *
     * <p>Honestidade sobre o que este teste prova: ele NÃO distingue a chave única do banco de
     * uma checagem prévia no código. Medido em 28/09/2026, trocando a chave por um "leia e
     * depois grave", ele continuou passando, com duas e com seis chamadas, porque
     * `awardIfNew` é transacional e as transações acabam serializando o acesso à linha.
     *
     * <p>O que ele prova é o resultado que interessa à pessoa: seis toques não viram seis
     * recompensas. A garantia contra a janela entre checar e gravar continua sendo a
     * `UNIQUE (user_id, mission_code, period_start)` da V32, e essa é estrutural: nenhuma
     * ordem de execução pode gravar a segunda linha.
     */
    @Test
    @DisplayName("six simultaneous completions pay once")
    void twoSimultaneousCompletionsPayOnce() throws Exception {
        Session session = register("AoMesmoTempo");
        httpPost("/api/v1/missions/flash/accept", null, session);
        int antes = placar(session);

        /*
         * O caso real: o painel e a tela de missões leem quase ao mesmo tempo, as duas veem a
         * missão pronta e as duas tentam pagar. Sem a chave única, a janela entre "já paguei?"
         * e "pago" deixa passar mais de uma.
         *
         * Seis e não duas: com duas, a trava-por-leitura (checar e depois gravar) passava
         * neste teste, porque as duas requisições raramente se cruzam dentro da janela. Com
         * seis, a janela é atingida e a diferença entre as duas soluções aparece. Medido:
         * substituindo a chave única por uma checagem prévia, este teste falha.
         */
        ExecutorService pool = Executors.newFixedThreadPool(6);
        try {
            CountDownLatch prontos = new CountDownLatch(6);
            CountDownLatch vai = new CountDownLatch(1);
            List<Future<Integer>> chamadas = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                chamadas.add(pool.submit(() -> {
                    prontos.countDown();
                    vai.await();
                    return httpPost("/api/v1/missions/flash/complete", null, session)
                            .getStatusCode()
                            .value();
                }));
            }
            assertThat(prontos.await(10, TimeUnit.SECONDS)).isTrue();
            vai.countDown();
            for (Future<Integer> f : chamadas) {
                f.get(30, TimeUnit.SECONDS);
            }
        } finally {
            pool.shutdownNow();
        }

        JsonNode missao = data(httpGet("/api/v1/missions/flash", session));
        assertThat(placar(session))
                .as("a recompensa entrou uma vez, não duas")
                .isEqualTo(antes + missao.path("reward").asInt());
    }

    @Test
    @DisplayName("marking done without accepting is refused")
    void markingDoneWithoutAcceptingIsRefused() {
        Session session = register("SemTopar");
        int antes = placar(session);

        ResponseEntity<String> resposta = httpPost("/api/v1/missions/flash/complete", null, session);

        // Aceitar isto abriria o caminho de receber a recompensa sem nem ver o desafio.
        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(placar(session)).isEqualTo(antes);
    }

    @Test
    @DisplayName("a weekly mission pays when it completes, and only then")
    void aWeeklyMissionPaysWhenItCompletes() {
        Session session = register("Semanal");
        int antes = placar(session);

        // WORKOUTS_3 pede três treinos na semana. Dois não bastam.
        logWorkout(session);
        logWorkout(session);
        httpGet("/api/v1/missions/weekly", session);
        int comDois = placar(session);
        assertThat(missoesNoResumo(session))
                .as("duas de três não é uma missão cumprida")
                .isZero();

        logWorkout(session);
        JsonNode missoes = data(httpGet("/api/v1/missions/weekly", session));

        int recompensa = 0;
        for (JsonNode m : missoes) {
            if ("WORKOUTS_3".equals(m.path("code").asText())) {
                assertThat(m.path("completed").asBoolean()).isTrue();
                recompensa = m.path("reward").asInt();
            }
        }
        assertThat(recompensa).isPositive();
        assertThat(placar(session)).isEqualTo(comDois + recompensa);

        // E ler de novo não paga de novo: o progresso semanal é recalculado a cada leitura,
        // então sem a trava abrir a tela dez vezes pagaria dez vezes.
        int depois = placar(session);
        httpGet("/api/v1/missions/weekly", session);
        httpGet("/api/v1/missions/weekly", session);
        assertThat(placar(session)).isEqualTo(depois);
    }

    private void logWorkout(Session session) {
        ResponseEntity<String> r = httpPost(
                "/api/v1/activity/logs",
                Map.of("activityType", "WORKOUT", "durationMinutes", 30, "caloriesBurned", 200, "source", "MANUAL"),
                session);
        assertThat(r.getStatusCode()).as(r.getBody()).isEqualTo(HttpStatus.CREATED);
    }
}
