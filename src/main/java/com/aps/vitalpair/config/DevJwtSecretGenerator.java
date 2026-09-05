package com.aps.vitalpair.config;

import java.security.SecureRandom;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Supplies a random JWT secret in the dev profile when none is configured.
 *
 * <p>The dev profile used to ship a fixed secret in application-dev.yaml. Since dev is also
 * the default profile, an application started without SPRING_PROFILES_ACTIVE would sign real
 * tokens with a value published in a public repository: anyone could mint a token for any
 * user. Deleting the default instead would have broken every fresh clone, since the app
 * refuses to start without a secret.
 *
 * <p>A per-start random value solves both. There is no committed secret, and nobody has to
 * configure anything to run the app locally. Tokens do not survive a restart, which is
 * correct for development and would be unacceptable in production, where JWT_SECRET is
 * required and validated by {@link JwtProperties}.
 */
public class DevJwtSecretGenerator implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DevJwtSecretGenerator.class);
    private static final String PROPERTY = "vitalpair.jwt.secret";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        boolean isDev = environment.matchesProfiles("dev");
        boolean alreadySet = environment.containsProperty(PROPERTY)
                && !environment.getProperty(PROPERTY, "").isBlank();

        if (!isDev || alreadySet) {
            return;
        }

        byte[] key = new byte[48];
        new SecureRandom().nextBytes(key);
        String secret = Base64.getEncoder().encodeToString(key);

        environment
                .getPropertySources()
                .addFirst(new MapPropertySource("vitalpair-dev-jwt-secret", java.util.Map.of(PROPERTY, secret)));

        log.warn("No JWT_SECRET set. Generated a random one for this run; every restart "
                + "invalidates existing tokens. Set JWT_SECRET in .env to keep sessions across restarts.");
    }
}
