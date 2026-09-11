package com.aps.vitalpair.entitlement;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * The paid plan at the door of every AI feature, through HTTP.
 *
 * <p>Nobody has paid yet, so the rule that matters most is the refusal: a free account gets
 * 402 from each of the four endpoints that would reach the model, before validation and
 * before any paid call. The borrowed access is checked through a real pair, formed and then
 * left, because that is the part of the rule a unit test with two mocked users cannot see.
 */
class AiGateIT extends AbstractIntegrationTest {

    /** A 1x1 PNG, enough to pass the request's validation and reach the use case. */
    private static final String TINY_PNG =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    @Test
    void aNewAccountIsFreeAndHasNoAiAccess() {
        Session free = register("Free");

        JsonNode entitlement = data(httpGet("/api/v1/entitlements/me", free));

        assertThat(entitlement.path("plan").asText()).isEqualTo("FREE");
        assertThat(entitlement.path("aiAccess").asBoolean()).isFalse();
    }

    @Test
    void everyAiEndpointRefusesAFreeAccountWith402() {
        Session free = register("Free");
        // A complete profile, so the only reason to refuse is the plan.
        completeProfile(free, Goal.LOSE_WEIGHT);

        assertPaymentRequired(httpPost("/api/v1/meal-plan/generate", null, free), "meal plan");
        assertPaymentRequired(
                httpPost("/api/v1/meal-plan/swap", Map.of("dayIndex", 0, "mealType", "LUNCH"), free), "meal swap");
        assertPaymentRequired(httpPost("/api/v1/workout-plan/generate", null, free), "workout plan");
        assertPaymentRequired(
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", TINY_PNG, "mediaType", "image/png"), free),
                "meal photo");
    }

    @Test
    void aPremiumAccountGetsPastTheDoor() {
        Session paying = register("Paying");
        completeProfile(paying, Goal.LOSE_WEIGHT);
        grantPremium(paying);

        JsonNode entitlement = data(httpGet("/api/v1/entitlements/me", paying));
        assertThat(entitlement.path("plan").asText()).isEqualTo("PREMIUM");
        assertThat(entitlement.path("aiAccess").asBoolean()).isTrue();

        // Whatever happens past the door (the model is a WireMock here) is another test's
        // business; what this one proves is that the door opened.
        assertThat(httpPost("/api/v1/workout-plan/generate", null, paying).getStatusCode())
                .isNotEqualTo(HttpStatus.PAYMENT_REQUIRED);
    }

    @Test
    void aPartnerBorrowsThePlanWhileThePairLastsAndThePayerKeepsIt() {
        Session payer = register("Payer");
        Session partner = register("Partner");
        pairUp(payer, partner);
        grantPremium(payer);

        Session partnerPaired = login(partner.email(), PASSWORD);
        JsonNode borrowed = data(httpGet("/api/v1/entitlements/me", partnerPaired));
        assertThat(borrowed.path("plan").asText())
                .as("the plan reported is their own")
                .isEqualTo("FREE");
        assertThat(borrowed.path("aiAccess").asBoolean())
                .as("borrowed while paired")
                .isTrue();

        // The pair ends: the payer keeps what they paid for, the partner loses the loan.
        Session payerPaired = login(payer.email(), PASSWORD);
        assertThat(httpDelete("/api/v1/pair/membership", payerPaired).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        Session partnerAlone = login(partner.email(), PASSWORD);
        assertThat(data(httpGet("/api/v1/entitlements/me", partnerAlone))
                        .path("aiAccess")
                        .asBoolean())
                .as("nothing to borrow once the pair has ended")
                .isFalse();

        Session payerAlone = login(payer.email(), PASSWORD);
        assertThat(data(httpGet("/api/v1/entitlements/me", payerAlone))
                        .path("aiAccess")
                        .asBoolean())
                .as("the person who paid keeps it")
                .isTrue();
    }

    @Test
    void entitlementsNeedASignedInCaller() {
        assertThat(anonymous(org.springframework.http.HttpMethod.GET, "/api/v1/entitlements/me", null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private void assertPaymentRequired(ResponseEntity<String> response, String feature) {
        assertThat(response.getStatusCode())
                .as("%s: %s", feature, response.getBody())
                .isEqualTo(HttpStatus.PAYMENT_REQUIRED);
        assertThat(body(response).path("message").asText())
                .as("%s carries the reason", feature)
                .contains("plano pago");
    }
}
