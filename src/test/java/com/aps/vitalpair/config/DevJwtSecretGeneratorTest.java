package com.aps.vitalpair.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

/**
 * The dev profile no longer ships a fixed JWT secret, because dev is also the default
 * profile: a deploy that forgets SPRING_PROFILES_ACTIVE would otherwise sign real tokens
 * with a value published in a public repository.
 *
 * <p>These tests pin the two behaviours that replacement depends on. Startup logs are not
 * proof: the generator runs before logging is configured, so nothing it writes is reliably
 * visible.
 */
class DevJwtSecretGeneratorTest {

    private static final String PROPERTY = "vitalpair.jwt.secret";

    private final DevJwtSecretGenerator generator = new DevJwtSecretGenerator();

    @Test
    void generatesASecretInDevWhenNoneIsConfigured() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("dev");

        generator.postProcessEnvironment(environment, null);

        String secret = environment.getProperty(PROPERTY);
        assertThat(secret).as("a fresh clone must start with no configuration").isNotBlank();
        assertThat(secret.length())
                .as("HS256 needs 256 bits, and JwtProperties rejects anything shorter")
                .isGreaterThanOrEqualTo(32);
    }

    @Test
    void generatesADifferentSecretEachRun() {
        MockEnvironment first = new MockEnvironment();
        first.setActiveProfiles("dev");
        MockEnvironment second = new MockEnvironment();
        second.setActiveProfiles("dev");

        generator.postProcessEnvironment(first, null);
        generator.postProcessEnvironment(second, null);

        assertThat(first.getProperty(PROPERTY))
                .as("a value repeated across runs would be a committed secret by another name")
                .isNotEqualTo(second.getProperty(PROPERTY));
    }

    @Test
    void keepsAConfiguredSecret() {
        String configured = "a-configured-secret-that-is-long-enough-for-hs256";
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("dev");
        environment.setProperty(PROPERTY, configured);

        generator.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty(PROPERTY))
                .as("overwriting the developer's own JWT_SECRET would log them out on every restart")
                .isEqualTo(configured);
    }

    @Test
    void generatesNothingOutsideDev() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        generator.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty(PROPERTY))
                .as("production must fail loudly on a missing secret, never invent one")
                .isNull();
    }
}
