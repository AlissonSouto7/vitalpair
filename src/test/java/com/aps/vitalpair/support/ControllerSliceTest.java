package com.aps.vitalpair.support;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.config.SecurityConfig;
import com.aps.vitalpair.shared.ratelimit.RateLimitResult;
import com.aps.vitalpair.shared.ratelimit.RateLimiter;
import com.aps.vitalpair.shared.web.JsonAuthenticationEntryPoint;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Base for {@code @WebMvcTest} slices.
 *
 * <p>The application's own {@link SecurityConfig} is imported rather than left to the slice's
 * default. A slice otherwise falls back to Spring Boot's stock security, which differs from
 * this application in ways that quietly invalidate the test: CSRF is enabled there, so every
 * POST answers 403 and a test either "passes" for the wrong reason or has to add a CSRF token
 * the real API never requires. Importing the real chain means a slice rejects and accepts
 * exactly what production does.
 *
 * <p>That chain needs a token provider and a Redis-backed limiter, which no slice has;
 * both are mocked here so every controller test starts from the same working setup.
 */
// JsonAuthenticationEntryPoint comes along because SecurityConfig requires it and a
// slice scans no @Component of its own.
@Import({SecurityConfig.class, JsonAuthenticationEntryPoint.class})
@ActiveProfiles("test")
public abstract class ControllerSliceTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper json;

    @MockitoBean
    protected TokenProviderPort tokenProvider;

    @MockitoBean
    protected RateLimiter rateLimiter;

    /**
     * Lets every request through the limiter by default.
     *
     * <p>A mocked limiter returns null, and the filter reads the result to set its headers, so
     * any slice for a rate-limited endpoint failed with a NullPointerException before the
     * controller was reached. Allowing by default keeps a slice about the controller; a test
     * that wants to see a 429 overrides this with its own stub.
     */
    @BeforeEach
    void allowRateLimitByDefault() {
        when(rateLimiter.check(any(), anyString())).thenReturn(new RateLimitResult(true, 1, Duration.ZERO));
    }

    protected String toJson(Object body) {
        try {
            return json.writeValueAsString(body);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalArgumentException(ex);
        }
    }
}
