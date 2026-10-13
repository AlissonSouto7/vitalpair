package com.aps.vitalpair.gamification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * O nível, somado do ledger.
 *
 * <p>Ele era calculado no navegador a partir do que a tela de temporada devolvia: temporada
 * atual mais o histórico das fechadas. Isso amarrava o esforço acumulado de meses ao que uma
 * resposta de API escolhe devolver, e bastava o histórico ser paginado para o nível cair.
 *
 * <p>O que estes testes protegem, em ordem: que o número vem do ledger inteiro, que ele sobe
 * com o uso, e que fechar uma temporada não o apaga, que é a garantia que justifica ter
 * mudado de lugar.
 */
class LevelIT extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    private JsonNode level(Session session) {
        return data(httpGet("/api/v1/gamification/level", session));
    }

    @Test
    @DisplayName("somebody who just arrived is level 1 with the next one in sight")
    void somebodyWhoJustArrivedIsLevelOne() {
        Session session = register("Nova");

        JsonNode nivel = level(session);

        assertThat(nivel.path("level").asInt()).isEqualTo(1);
        assertThat(nivel.path("points").asLong()).isZero();
        assertThat(nivel.path("percent").asInt()).isZero();
        // O número que faz alguém registrar mais uma coisa hoje.
        assertThat(nivel.path("pointsToNext").asLong()).isPositive();
    }

    @Test
    @DisplayName("the level follows what the ledger holds, not what a season shows")
    void theLevelFollowsTheLedger() {
        Session session = register("Somando");
        logMeal(session);
        logWorkout(session);

        long noLedger = jdbc.queryForObject(
                "select coalesce(sum(points), 0) from point_events where user_id = ?", Long.class, session.userId());
        assertThat(noLedger).isPositive();

        assertThat(level(session).path("points").asLong())
                .as("o nível conta o que o ledger guarda")
                .isEqualTo(noLedger);
    }

    @Test
    @DisplayName("the bar moves as somebody logs, which is the point of showing it")
    void theBarMovesAsSomebodyLogs() {
        Session session = register("Subindo");
        int antes = level(session).path("percent").asInt();

        logMeal(session);
        logWorkout(session);

        JsonNode depois = level(session);
        assertThat(depois.path("percent").asInt()).isGreaterThan(antes);
        assertThat(depois.path("pointsToNext").asLong())
                .as("falta menos do que faltava")
                .isLessThan(150);
    }

    @Test
    @DisplayName("closing a season does not wipe the level")
    void closingASeasonDoesNotWipeTheLevel() {
        Session session = register("Temporada");
        logMeal(session);
        logWorkout(session);
        long antes = level(session).path("points").asLong();
        assertThat(antes).isPositive();

        /*
         * Fecha a temporada atual à força e força a próxima a abrir, que é o que o rollover
         * faz sozinho ao virar o trigésimo dia. O placar da temporada nova começa do zero por
         * desenho; o nível não pode, porque ele é o acumulado de quem usa.
         *
         * Era exatamente aqui que o cálculo do navegador falhava: ele somava a temporada
         * atual com o histórico devolvido, então dependia de a API continuar devolvendo tudo.
         */
        // A temporada é criada preguiçosamente na primeira leitura, então é preciso lê-la
        // antes de conseguir envelhecê-la.
        var leitura = httpGet("/api/v1/season", session);
        assertThat(leitura.getStatusCode())
                .as("a temporada tem de ser legível: %s", leitura.getBody())
                .isEqualTo(HttpStatus.OK);
        int linhas = jdbc.update(
                "update seasons set start_date = start_date - interval '60 days',"
                        + " end_date = end_date - interval '60 days'"
                        + " where tenant_id = (select tenant_id from users where id = ?)"
                        + " and status = 'ACTIVE'",
                session.userId());
        assertThat(linhas).as("a temporada a envelhecer tem de existir").isEqualTo(1);
        httpGet("/api/v1/season", session);

        JsonNode temporada = data(httpGet("/api/v1/season", session));
        assertThat(temporada.path("number").asInt())
                .as("a temporada rolou, que é a condição deste teste")
                .isGreaterThan(1);
        /*
         * O placar da temporada nova conta só a janela dela, somada do ledger. Aqui os pontos
         * foram ganhos hoje e hoje cai dentro da nova, então ele não é zero: o que interessa é
         * que ele é um recorte, enquanto o nível é o acumulado. A prova de que são coisas
         * diferentes está na asserção seguinte, que passa a valer quando o recorte muda.
         */

        assertThat(level(session).path("points").asLong())
                .as("o nível sobrevive à virada de temporada")
                .isEqualTo(antes);
    }

    private void logMeal(Session session) {
        assertThat(httpPost(
                                "/api/v1/nutrition/logs",
                                Map.of(
                                        "foodName", "Arroz",
                                        "quantityG", 150,
                                        "caloriesKcal", 190,
                                        "mealType", "LUNCH",
                                        "source", "MANUAL"),
                                session)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
    }

    private void logWorkout(Session session) {
        assertThat(httpPost(
                                "/api/v1/activity/logs",
                                Map.of(
                                        "activityType",
                                        "WORKOUT",
                                        "durationMinutes",
                                        30,
                                        "caloriesBurned",
                                        200,
                                        "source",
                                        "MANUAL"),
                                session)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
    }
}
