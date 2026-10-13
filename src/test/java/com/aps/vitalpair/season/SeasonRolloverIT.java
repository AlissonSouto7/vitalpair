package com.aps.vitalpair.season;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * A virada de temporada, que acontece uma vez por mês para todo mundo.
 *
 * <p>Uma temporada dura 30 dias e a seguinte abre sozinha na primeira leitura depois do
 * vencimento. Fechar a atual e abrir a próxima são duas escritas da mesma transação, e o
 * índice {@code uq_seasons_active_per_tenant} garante uma só ACTIVE por par.
 *
 * <p>Medido em 28/09/2026 contra o servidor local: com o save comum, as duas escritas ficavam
 * na memória do Hibernate e desciam juntas no fim, então por um instante existiam duas ACTIVE
 * e o banco recusava. A tela de temporada respondia 500 com
 * {@code duplicate key value violates unique constraint "uq_seasons_active_per_tenant"}, e não
 * voltava a funcionar. Com temporadas de 30 dias, isso aconteceria com cada dupla, uma vez por
 * mês, sem nada que a pessoa pudesse fazer.
 */
class SeasonRolloverIT extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    /** Envelhece a temporada ativa, que é o que o calendário faz sozinho no trigésimo dia. */
    private void ageTheActiveSeason(Session session, int dias) {
        httpGet("/api/v1/season", session);
        int linhas = jdbc.update(
                "update seasons set start_date = start_date - make_interval(days => ?),"
                        + " end_date = end_date - make_interval(days => ?)"
                        + " where tenant_id = (select tenant_id from users where id = ?)"
                        + " and status = 'ACTIVE'",
                dias,
                dias,
                session.userId());
        assertThat(linhas).as("a temporada a envelhecer tem de existir").isEqualTo(1);
    }

    @Test
    @DisplayName("an expired season rolls into the next instead of answering 500")
    void anExpiredSeasonRollsIntoTheNext() {
        Session session = register("Virada");
        logMeal(session);
        ageTheActiveSeason(session, 31);

        ResponseEntity<String> resposta = httpGet("/api/v1/season", session);

        assertThat(resposta.getStatusCode())
                .as("a leitura da temporada vencida: %s", resposta.getBody())
                .isEqualTo(HttpStatus.OK);
        assertThat(data(resposta).path("number").asInt())
                .as("a próxima temporada abriu")
                .isEqualTo(2);
    }

    @Test
    @DisplayName("several missed seasons roll one after another, not just one")
    void severalMissedSeasonsRollOneAfterAnother() {
        Session session = register("SumiuUmTempo");
        // Quem passou dois meses longe do aplicativo volta e encontra a temporada certa, e não
        // a de dois meses atrás.
        ageTheActiveSeason(session, 70);

        JsonNode temporada = data(httpGet("/api/v1/season", session));

        assertThat(temporada.path("number").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(temporada.path("daysLeft").asInt()).isPositive();
    }

    @Test
    @DisplayName("the closed season keeps exactly one active per pair")
    void exactlyOneActiveSeasonPerPair() {
        Session session = register("UmaAtiva");
        ageTheActiveSeason(session, 31);
        httpGet("/api/v1/season", session);

        Integer ativas = jdbc.queryForObject(
                "select count(*) from seasons where status = 'ACTIVE'"
                        + " and tenant_id = (select tenant_id from users where id = ?)",
                Integer.class,
                session.userId());
        Integer fechadas = jdbc.queryForObject(
                "select count(*) from seasons where status = 'CLOSED'"
                        + " and tenant_id = (select tenant_id from users where id = ?)",
                Integer.class,
                session.userId());

        assertThat(ativas).isEqualTo(1);
        assertThat(fechadas).as("a que venceu ficou guardada, não sumiu").isEqualTo(1);
    }

    @Test
    @DisplayName("the stake carries into the new season, because it is the couple's agreement")
    void theStakeCarriesIntoTheNewSeason() {
        Session session = register("Aposta");
        String combinado =
                data(httpGet("/api/v1/season", session)).path("stake").asText();
        assertThat(combinado).isNotBlank();

        ageTheActiveSeason(session, 31);

        assertThat(data(httpGet("/api/v1/season", session)).path("stake").asText())
                .as("o que estava combinado continua valendo")
                .isEqualTo(combinado);
    }

    @Test
    @DisplayName("the history keeps the season that ended")
    void theHistoryKeepsTheSeasonThatEnded() {
        Session session = register("Historico");
        logMeal(session);
        ageTheActiveSeason(session, 31);

        JsonNode temporada = data(httpGet("/api/v1/season", session));

        // Sem isto, a virada apagaria da vista o mês inteiro que a pessoa jogou.
        assertThat(temporada.path("history")).isNotEmpty();
        assertThat(temporada.path("history").path(0).path("number").asInt()).isEqualTo(1);
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
}
