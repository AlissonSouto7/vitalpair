package com.aps.vitalpair.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.config.SecurityConfig;
import com.aps.vitalpair.shared.ratelimit.RateLimiter;
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
@Import(SecurityConfig.class)
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

    protected String toJson(Object body) {
        try {
            return json.writeValueAsString(body);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalArgumentException(ex);
        }
    }
}
