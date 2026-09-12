package com.aps.vitalpair.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.MailpitSupport;
import com.aps.vitalpair.support.MailpitSupport.Mail;

/**
 * Registration must not say whether an address already has an account.
 *
 * <p>It used to: a known address answered 422 "e-mail already registered" and an unknown one
 * answered 201 with a session. That difference is an oracle. Anyone with a list of addresses
 * could learn which of them belong to users, which is the input to targeted phishing and to
 * password attacks that only try accounts known to exist.
 *
 * <p>Both cases now answer 202 with the same body, and what differs happens by e-mail, where
 * only the mailbox's owner can see it: a new address receives an activation link, an existing
 * one receives a notice that somebody tried to register with it. These tests compare the two
 * responses field by field and then read the mailbox to prove each side still did its job.
 */
class RegisterEnumerationIT extends AbstractIntegrationTest {

    @BeforeEach
    void emptyTheMailbox() {
        MailpitSupport.deleteAll();
    }

    /** Registers through HTTP without asserting the status, which is what these tests compare. */
    private ResponseEntity<String> signUp(String email) {
        return anonymous(
                HttpMethod.POST,
                "/api/v1/auth/register",
                Map.of("name", "Tester", "email", email, "password", PASSWORD));
    }

    /** An address with an account, activated through the link, ready to sign in. */
    private String activatedAccount(String name) {
        String email = uniqueEmail(name);
        assertThat(signUp(email).getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        Mail mail = MailpitSupport.latestTo(email).orElseThrow();
        String token = URLDecoder.decode(mail.token(), StandardCharsets.UTF_8);
        assertThat(anonymous(HttpMethod.POST, "/api/v1/auth/verify-email", Map.of("token", token))
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);
        return email;
    }

    @Test
    @DisplayName("registering a known address is indistinguishable from registering a new one")
    void registeringAKnownAddressIsIndistinguishableFromRegisteringANewOne() {
        String taken = activatedAccount("Existente");
        MailpitSupport.deleteAll();

        ResponseEntity<String> onTaken = signUp(taken);
        ResponseEntity<String> onFresh = signUp(uniqueEmail("Novo"));

        assertThat(onTaken.getStatusCode())
                .as("the answer for a taken address must not differ: %s", onTaken.getBody())
                .isEqualTo(onFresh.getStatusCode());
        assertThat(body(onTaken))
                .as("the bodies must be identical, or the difference is the oracle")
                .isEqualTo(body(onFresh));
        assertThat(onTaken.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(body(onTaken).path("data").path("accessToken").isMissingNode())
                .as("a session in the body would tell the two cases apart")
                .isTrue();
    }

    @Test
    @DisplayName("a new address receives a link that activates the account")
    void aNewAddressReceivesALinkThatActivatesTheAccount() {
        String email = uniqueEmail("Ativa");

        assertThat(signUp(email).getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

        Mail mail = MailpitSupport.latestTo(email).orElseThrow();
        assertThat(mail.link()).contains("/verify-email?token=");

        String token = URLDecoder.decode(mail.token(), StandardCharsets.UTF_8);
        ResponseEntity<String> verify = anonymous(HttpMethod.POST, "/api/v1/auth/verify-email", Map.of("token", token));
        assertThat(verify.getStatusCode()).as(verify.getBody()).isEqualTo(HttpStatus.OK);

        Session session = login(email, PASSWORD);
        assertThat(data(httpGet("/api/v1/users/me", session))
                        .path("emailVerified")
                        .asBoolean())
                .as("the link is what marks the address confirmed")
                .isTrue();
    }

    @Test
    @DisplayName("an address that already has an account is warned instead of duplicated")
    void anAddressThatAlreadyHasAnAccountIsWarnedInsteadOfDuplicated() {
        String email = activatedAccount("Avisado");
        MailpitSupport.deleteAll();

        signUp(email);

        Mail mail = MailpitSupport.latestTo(email).orElseThrow();
        // No token anywhere in it: there is nothing to activate, and a link that granted
        // something would turn a warning into the very thing it warns about.
        assertThat(mail.token())
                .as("the notice carries no token, so it cannot be used to take the account")
                .isNull();
        assertThat(mail.html())
                .as("it points the owner at signing in")
                .doesNotContain("/verify-email?token=")
                .contains("/login");
        assertThat(login(email, PASSWORD).accessToken())
                .as("the password the owner already had still works")
                .isNotBlank();
    }

    @Test
    @DisplayName("the second attempt does not create a second account")
    void theSecondAttemptDoesNotCreateASecondAccount() {
        String email = activatedAccount("Unico");
        java.util.UUID first = login(email, PASSWORD).userId();

        signUp(email);

        assertThat(login(email, PASSWORD).userId())
                .as("a second account would mean a different id for the same address")
                .isEqualTo(first);
    }

    @Test
    @DisplayName("an unverified account cannot sign in yet")
    void anUnverifiedAccountCannotSignInYet() {
        String email = uniqueEmail("Pendente");
        assertThat(signUp(email).getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

        ResponseEntity<String> login =
                anonymous(HttpMethod.POST, "/api/v1/auth/login", Map.of("email", email, "password", PASSWORD));

        assertThat(login.getStatusCode())
                .as("signing in before the link is used would make the flow pointless: %s", login.getBody())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
