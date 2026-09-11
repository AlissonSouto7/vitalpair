package com.aps.vitalpair.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The application's clock, as a bean so a service can be told what time it is.
 *
 * <p>A service that calls {@code Instant.now()} can only be tested at the moment the test
 * runs; one that asks a {@link Clock} can be tested a second before an expiry and a second
 * after it. UTC, because an instant has no zone; anything that needs a day asks the person's
 * zone, never this.
 */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
