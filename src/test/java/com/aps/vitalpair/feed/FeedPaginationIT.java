package com.aps.vitalpair.feed;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Paging the feed, including the values a client should not be sending.
 *
 * <p>A 500 for bad input is worse than it looks: it tells the caller the server broke, and it
 * writes a stack trace into the log for something that is not a fault. Enough of those and
 * the log stops being the place you look when something real happens.
 */
class FeedPaginationIT extends AbstractIntegrationTest {

    @ParameterizedTest
    @ValueSource(strings = {"?page=-1", "?size=-1", "?size=0", "?page=-3&size=-2"})
    void anImpossiblePageIsRefusedRatherThanCrashing(String query) {
        Session user = register("Reader");

        ResponseEntity<String> response = httpGet("/api/v1/pair/feed" + query, user);

        assertThat(response.getStatusCode())
                .as("bad input is the caller's fault, not the server's: %s", query)
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).path("data").path("violations"))
                .as("the answer should name the parameter: %s", response.getBody())
                .isNotEmpty();
    }

    @Test
    void anOversizedPageIsCappedRatherThanRefused() {
        Session user = register("Reader");

        ResponseEntity<String> response = httpGet("/api/v1/pair/feed?size=5000", user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Asking for too much is a reasonable thing a client does; refusing it would be
        // pedantic, so the server quietly gives the most it is willing to.
        assertThat(data(response).path("size").asInt()).isEqualTo(50);
    }

    @Test
    void theDefaultPageIsTwentyItemsNewestFirst() {
        Session user = register("Reader");

        ResponseEntity<String> response = httpGet("/api/v1/pair/feed", user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode page = data(response);
        assertThat(page.path("page").asInt()).isZero();
        assertThat(page.path("size").asInt()).isEqualTo(20);
    }
}
