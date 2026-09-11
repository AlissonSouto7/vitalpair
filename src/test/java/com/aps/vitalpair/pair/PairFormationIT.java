package com.aps.vitalpair.pair;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.user.domain.model.UserTimeZones;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Forming a pair, which is the moment the tenant of one of the two people changes.
 *
 * <p>Joining is the only operation in the product that moves a user between tenants, and it
 * runs against a schema where twelve foreign keys point at {@code pairs}, every one of them
 * NO ACTION. Whatever the joiner had already recorded is therefore still pointing at the
 * tenant being abandoned, which is what these tests are about.
 */
class PairFormationIT extends AbstractIntegrationTest {

    @Test
    void joiningMovesTheGuestIntoTheInvitersTenantAndActivatesThePair() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");

        ResponseEntity<String> invite = httpPost("/api/v1/pair/invite", null, inviter);
        assertThat(invite.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = data(invite).path("inviteCode").asText();

        ResponseEntity<String> join = httpPost("/api/v1/pair/join/" + code, null, joiner);
        assertThat(join.getStatusCode()).as("join: %s", join.getBody()).isEqualTo(HttpStatus.OK);

        JsonNode pair = data(join);
        assertThat(pair.path("status").asText()).isEqualTo("ACTIVE");
        assertThat(pair.path("members")).hasSize(2);
        assertThat(pair.path("pairName").asText()).isEqualTo("Inviter & Joiner");
    }

    /**
     * The case that matters: the guest used the app before pairing up.
     *
     * <p>Their meal carries the tenant id of the pending pair they are about to leave, and
     * {@code PairService} deletes that pair once the join succeeds. Nothing cascades, so
     * either the delete is refused or a row is left pointing at a tenant that no longer
     * exists. This test is what says which.
     */
    @Test
    void aGuestWhoAlreadyLoggedAMealCanStillJoin() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");

        ResponseEntity<String> meal = httpPost(
                "/api/v1/nutrition/logs",
                Map.of(
                        "foodName", "Banana",
                        "quantityG", 100,
                        "caloriesKcal", 89,
                        "mealType", "BREAKFAST",
                        "source", "MANUAL"),
                joiner);
        assertThat(meal.getStatusCode()).as("log a meal: %s", meal.getBody()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> invite = httpPost("/api/v1/pair/invite", null, inviter);
        String code = data(invite).path("inviteCode").asText();

        ResponseEntity<String> join = httpPost("/api/v1/pair/join/" + code, null, joiner);
        assertThat(join.getStatusCode())
                .as("a guest with existing data should still be able to join: %s", join.getBody())
                .isEqualTo(HttpStatus.OK);

        // The meal must still be readable afterwards. A row orphaned onto a deleted tenant
        // would be invisible to every tenant-scoped query, which is data loss that no error
        // message announces.
        Session renewed = login(joiner.email(), PASSWORD);
        // Today in the person's zone, which is how the API buckets the day; see LeavePairIT.
        ResponseEntity<String> logs =
                httpGet("/api/v1/nutrition/logs?date=" + java.time.LocalDate.now(UserTimeZones.FALLBACK), renewed);
        assertThat(logs.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data(logs))
                .as("the meal logged before pairing: %s", logs.getBody())
                .hasSize(1);
    }

    @Test
    void anInviteCodeCannotBeUsedTwice() {
        Session inviter = register("Inviter");
        Session first = register("First");
        Session second = register("Second");

        String code = data(httpPost("/api/v1/pair/invite", null, inviter))
                .path("inviteCode")
                .asText();

        assertThat(httpPost("/api/v1/pair/join/" + code, null, first).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> late = httpPost("/api/v1/pair/join/" + code, null, second);
        assertThat(late.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(body(late).path("message").asText()).contains("não está mais disponível");
    }

    @Test
    void youCannotJoinYourOwnInvite() {
        Session alone = register("Alone");
        String code = data(httpPost("/api/v1/pair/invite", null, alone))
                .path("inviteCode")
                .asText();

        ResponseEntity<String> response = httpPost("/api/v1/pair/join/" + code, null, alone);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    /**
     * The preview is the one endpoint here that anonymous callers reach, because the invite
     * link is opened before signing up. It must therefore say as little as possible.
     */
    @Test
    void theInvitePreviewIsPublicAndRevealsOnlyTheFirstName() {
        Session inviter = register("Maria Fernanda Souza");
        String code = data(httpPost("/api/v1/pair/invite", null, inviter))
                .path("inviteCode")
                .asText();

        ResponseEntity<String> preview = anonymous(HttpMethod.GET, "/api/v1/pair/invite/" + code, null);
        assertThat(preview.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode data = data(preview);
        assertThat(data.path("inviterName").asText()).isEqualTo("Maria");
        assertThat(data.path("full").asBoolean()).isFalse();
        assertThat(preview.getBody())
                .as("the invite preview must not leak the address")
                .doesNotContain("@");
    }

    @Test
    void anAlreadyPairedUserCannotGenerateAnotherInvite() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");
        pairUp(inviter, joiner);

        Session renewed = login(inviter.email(), PASSWORD);
        ResponseEntity<String> response = httpPost("/api/v1/pair/invite", null, renewed);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(body(response).path("message").asText()).contains("já tem um parceiro");
    }
}
