package com.aps.vitalpair.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;
import com.aps.vitalpair.support.AbstractIntegrationTest;

/**
 * Ending every session a person has, everywhere, at once.
 *
 * <p>Tokens are grouped into families, one per login, and until now a family could only be
 * reached by presenting a token belonging to it. That is enough for logout, where the caller
 * has the token in hand, and not enough for anything done to an account rather than by it:
 * a password reset, an account closing, an administrator cutting off a compromised login.
 * There was no way to enumerate one person's families, so their other sessions stayed alive.
 *
 * <p>Two devices are simulated by logging in twice, which is exactly what produces two
 * families for one user.
 */
class SessionRevocationIT extends AbstractIntegrationTest {

    @Autowired
    private RefreshTokenStorePort refreshTokenStore;

    @Test
    void revokingAUsersSessionsEndsEveryDeviceAtOnce() {
        Session first = register("Multi");
        Session second = login(first.email(), PASSWORD);

        // Each device's token is used once and replaced by the one that comes back, which is
        // what a real client does. Refreshing with the same token twice would be a replay,
        // and the theft detection would revoke that family on its own: the test would then
        // pass whether or not the thing under test works at all.
        String firstToken = refreshTokenFrom(assertRefreshWorks(first.refreshToken()));
        String secondToken = refreshTokenFrom(assertRefreshWorks(second.refreshToken()));

        refreshTokenStore.revokeAllForUser(first.userId());

        assertThat(refreshWith(firstToken).getStatusCode())
                .as("the first device is signed out")
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(refreshWith(secondToken).getStatusCode())
                .as("and so is the second")
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /**
     * The reason someone resets a password is usually that somebody else knows it.
     *
     * <p>Before this the reset changed the hash and left every existing session alive, so an
     * intruder holding a refresh token kept renewing it for thirty days while the owner
     * believed they had locked them out. The reset is the moment to end those sessions,
     * because it is the moment the owner thinks they did.
     */
    @Test
    void resettingThePasswordSignsOutEveryExistingSession() {
        Session session = register("Resetter");
        String intruderToken = refreshTokenFrom(assertRefreshWorks(session.refreshToken()));

        ResponseEntity<String> forgot =
                anonymous(HttpMethod.POST, "/api/v1/auth/forgot-password", Map.of("email", session.email()));
        assertThat(forgot.getStatusCode()).isEqualTo(HttpStatus.OK);

        // MAIL_ENABLED is false under test, so the link is written to the log rather than
        // sent. The token is read from Redis, which is where the service put it.
        String resetToken = passwordResetTokenOf(session.userId());
        ResponseEntity<String> reset = anonymous(
                HttpMethod.POST,
                "/api/v1/auth/reset-password",
                Map.of("token", resetToken, "newPassword", "Novasenha@2026"));
        assertThat(reset.getStatusCode()).as("reset: %s", reset.getBody()).isEqualTo(HttpStatus.OK);

        assertThat(refreshWith(intruderToken).getStatusCode())
                .as("the session that existed before the reset is dead")
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        // And the owner can sign in with the new password, so the reset itself worked.
        assertThat(login(session.email(), "Novasenha@2026").accessToken()).isNotBlank();
    }

    /** The reset token the service stored for this user, found by scanning its key space. */
    private String passwordResetTokenOf(UUID userId) {
        Set<String> keys = redis.keys("pwdreset:*");
        assertThat(keys).as("a reset token should have been stored").isNotNull().isNotEmpty();
        return keys.stream()
                .filter(key -> userId.toString().equals(redis.opsForValue().get(key)))
                .map(key -> key.substring("pwdreset:".length()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no reset token stored for user " + userId));
    }

    /** Refreshes and asserts it worked, returning the response so the new token can be read. */
    private ResponseEntity<String> assertRefreshWorks(String refreshToken) {
        ResponseEntity<String> response = refreshWith(refreshToken);
        assertThat(response.getStatusCode())
                .as("the session should be live before anything is revoked: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);
        return response;
    }

    @Test
    void revokingOnePersonLeavesEveryoneElseSignedIn() {
        Session target = register("Target");
        Session bystander = register("Bystander");

        refreshTokenStore.revokeAllForUser(target.userId());

        assertThat(refresh(bystander).getStatusCode())
                .as("someone else's session is untouched")
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void revokingSomeoneWithNoSessionsIsHarmless() {
        Session session = register("Quiet");

        refreshTokenStore.revokeAllForUser(session.userId());
        refreshTokenStore.revokeAllForUser(session.userId());

        assertThat(refresh(session).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /**
     * Rotation must not leave the index pointing at a family that no longer matters.
     *
     * <p>Every refresh issues a new token in the same family, so the index should still hold
     * exactly one entry for that person afterwards, and revoking must still reach it.
     */
    @Test
    void aRotatedSessionIsStillRevocable() {
        Session session = register("Rotating");

        ResponseEntity<String> rotated = refresh(session);
        assertThat(rotated.getStatusCode()).isEqualTo(HttpStatus.OK);
        String rotatedToken = refreshTokenFrom(rotated);

        refreshTokenStore.revokeAllForUser(session.userId());

        assertThat(withRefreshCookie(HttpMethod.POST, "/api/v1/auth/refresh", rotatedToken)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private ResponseEntity<String> refresh(Session session) {
        return refreshWith(session.refreshToken());
    }

    private ResponseEntity<String> refreshWith(String refreshToken) {
        return withRefreshCookie(HttpMethod.POST, "/api/v1/auth/refresh", refreshToken);
    }
}
