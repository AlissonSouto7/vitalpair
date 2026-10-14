package com.aps.vitalpair.gamification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * As medalhas de peso, contra o banco e através da API.
 *
 * <p>A categoria WEIGHT existia desde a V6 e nenhuma medalha a usava: a família aparecia
 * vazia para todo mundo. O que estes testes protegem é a regra escolhida para preenchê-la: a
 * medalha mede a direção do objetivo de cada um, e não quilos perdidos, porque este produto é
 * feito para duas pessoas que querem ir para lados contrários.
 *
 * <p>UM CADASTRO POR TESTE, no máximo. O registro é limitado a cinco por minuto por endereço,
 * e esta classe nasceu com oito testes criando oito contas: os oito falharam, e não por causa
 * da regra. O controle que provou o diagnóstico foi desativar sete e rodar um sozinho, que
 * passou. Cada teste agora leva uma conta ao limite do que ela consegue cobrir.
 *
 * <p>Dois detalhes do fluxo real que estes testes exercitam de propósito, e que um teste de
 * unidade não pegaria: salvar o perfil já registra uma pesagem (o peso do formulário vira a
 * linha de hoje em {@code weight_logs}), e por isso a primeira pesagem de alguém não tem
 * contra o que ser comparada.
 */
class WeightBadgeIT extends AbstractIntegrationTest {

    private List<String> badgeCodes(Session session) {
        return data(httpGet("/api/v1/gamification/badges", session)).findValuesAsText("code");
    }

    private JsonNode earnedBadge(Session session, String code) {
        for (JsonNode node : data(httpGet("/api/v1/gamification/badges", session))) {
            if (code.equals(node.path("badge").path("code").asText())) {
                return node;
            }
        }
        return null;
    }

    private void weighIn(Session session, double kg) {
        var response = httpPost("/api/v1/progress/weight", Map.of("weightKg", kg), session);
        assertThat(response.getStatusCode())
                .as("weigh-in: %s", response.getBody())
                .isIn(HttpStatus.OK, HttpStatus.CREATED, HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("losing towards the goal climbs the ladder, and the badge carries its date")
    void losingTowardsTheGoalClimbsTheLadder() {
        Session session = register("Perdedora");
        // O perfil grava 75 kg e isso já é a primeira pesagem: é daqui que a medida parte.
        completeProfile(session, Goal.LOSE_WEIGHT);

        assertThat(badgeCodes(session))
                .as("nada de peso antes de qualquer variação")
                .doesNotContain("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS");

        /*
         * UMA pesagem, não uma sequência delas.
         *
         * A API aceita uma pesagem por dia e substitui a do dia (upsert em
         * (user_id, recorded_on)), então um teste que pesa 74, depois 72, depois 68 no mesmo
         * dia não está subindo a escada: está reescrevendo a mesma linha, e como ela é também
         * a mais antiga, o ponto de partida anda junto. A segunda medida saía 74 -> 72, dois
         * quilos, e não os três que o teste esperava. Em uso real as linhas são de dias
         * diferentes e a mais antiga fica onde está.
         *
         * O que este teste cobre, então, é o salto de uma pessoa cujo início está gravado em
         * 75: pesar 68 é sete quilos na direção do objetivo, e as três medalhas da escada
         * saem juntas, porque as menores também foram atingidas.
         */
        weighIn(session, 68);
        assertThat(badgeCodes(session)).contains("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS");

        // Pesar de novo não concede a mesma medalha duas vezes: awardByCode é idempotente.
        weighIn(session, 67);
        assertThat(badgeCodes(session)).filteredOn("WEIGHT_THREE_KILOS"::equals).hasSize(1);

        // A data da conquista, que a tela mostra no cartão. Está no banco desde a V6 e a tela
        // a descartava; se ela não chegar até aqui, não há o que mostrar.
        JsonNode badge = earnedBadge(session, "WEIGHT_THREE_KILOS");
        assertThat(badge).as("a medalha de 3 kg na resposta").isNotNull();
        assertThat(badge.path("earnedAt").asText()).isNotBlank();
        assertThat(badge.path("badge").path("category").asText()).isEqualTo("WEIGHT");
    }

    @Test
    @DisplayName("the same kilos read the other way for somebody who wants to gain")
    void theSameKilosReadTheOtherWayForSomebodyWhoWantsToGain() {
        // O caso que define o produto: a mesma variação, lida dos dois lados. Sem isto, a
        // medalha premiaria metade do casal e puniria a outra pelo mesmo acerto.
        Session session = register("Massa");
        completeProfile(session, Goal.GAIN_MUSCLE);

        weighIn(session, 72);
        assertThat(badgeCodes(session))
                .as("perder 3 kg não é progresso para quem quer ganhar")
                .doesNotContain("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS");

        weighIn(session, 78);
        assertThat(badgeCodes(session)).contains("WEIGHT_THREE_KILOS");
    }

    @Test
    @DisplayName("keeping the weight is the achievement for whoever chose to keep it")
    void keepingTheWeightIsTheAchievement() {
        Session session = register("Firme");
        completeProfile(session, Goal.MAINTAIN);

        weighIn(session, 75.2);
        assertThat(badgeCodes(session)).contains("WEIGHT_STEADY");

        // E mover-se de verdade não concede mais nada: a medalha aqui é por ficar.
        weighIn(session, 70);
        assertThat(badgeCodes(session)).doesNotContain("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS");
    }

    @Test
    @DisplayName("the Weight family stopped being empty, and earns nothing without a direction")
    void theWeightFamilyStoppedBeingEmpty() {
        Session session = register("Condicionamento");

        List<String> weightCodes =
                data(httpGet("/api/v1/gamification/badges/catalog", session)).findParents("category").stream()
                        .filter(n -> "WEIGHT".equals(n.path("category").asText()))
                        .map(n -> n.path("code").asText())
                        .toList();
        assertThat(weightCodes)
                .as("a família Peso aparecia na tela sem uma única medalha dentro")
                .containsExactlyInAnyOrder(
                        "WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS", "WEIGHT_STEADY");

        // Quem não disse para que lado quer ir não ganha nada, por muito que se mova: o
        // aplicativo não sabe para que lado torcer, e escolher um seria decidir por ela.
        completeProfile(session, Goal.IMPROVE_FITNESS);
        weighIn(session, 68);

        assertThat(badgeCodes(session))
                .doesNotContain("WEIGHT_FIRST_KILO", "WEIGHT_THREE_KILOS", "WEIGHT_SEVEN_KILOS", "WEIGHT_STEADY");
    }
}
