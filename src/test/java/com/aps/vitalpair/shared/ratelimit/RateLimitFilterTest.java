package com.aps.vitalpair.shared.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * The ceilings the filter applies, and where they come from.
 *
 * <p>{@code RateLimitIT} proves the limit works end to end at its production value. What is
 * left to pin is that login and registration read their ceiling from configuration: the
 * browser suite raises them for its own run, and if that binding quietly stopped working the
 * suite would go back to failing at random on a limit nobody changed.
 */
class RateLimitFilterTest {

    private final RateLimiter rateLimiter = mock(RateLimiter.class);

    /** The limit the filter reports for a route, read off the header a client sees. */
    private String limitFor(String uri, int loginPerMinute, int registerPerMinute) throws Exception {
        return limitFor(uri, loginPerMinute, registerPerMinute, 30);
    }

    private String limitFor(String uri, int loginPerMinute, int registerPerMinute, int refreshPerMinute)
            throws Exception {
        when(rateLimiter.check(any(), anyString())).thenReturn(new RateLimitResult(true, 1, null));
        RateLimitFilter filter = new RateLimitFilter(
                rateLimiter, new ObjectMapper(), loginPerMinute, registerPerMinute, refreshPerMinute);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, mock(FilterChain.class));

        return response.getHeader("X-RateLimit-Limit");
    }

    @Test
    @DisplayName("login and registration use the configured ceiling")
    void loginAndRegistrationUseTheConfiguredCeiling() throws Exception {
        assertThat(limitFor("/api/v1/auth/login", 60, 30)).isEqualTo("60");
        assertThat(limitFor("/api/v1/auth/register", 60, 30)).isEqualTo("30");
        // Refresh is the one the browser suite runs out of first: every screen it opens
        // renews the session, so the ceiling is reached at roughly one per page load.
        assertThat(limitFor("/api/v1/auth/refresh", 60, 30, 200)).isEqualTo("200");
    }

    @Test
    @DisplayName("the shipped defaults are the ones production runs with")
    void theShippedDefaultsAreTheOnesProductionRunsWith() throws Exception {
        // The numbers in the @Value defaults. A change to them is a change to what protects
        // the login form, so it should not pass unnoticed.
        assertThat(limitFor("/api/v1/auth/login", 10, 5)).isEqualTo("10");
        assertThat(limitFor("/api/v1/auth/register", 10, 5)).isEqualTo("5");
        assertThat(limitFor("/api/v1/auth/refresh", 10, 5, 30)).isEqualTo("30");
    }

    @Test
    @DisplayName("the other routes keep the limits written in the code")
    void theOtherRoutesKeepTheLimitsWrittenInTheCode() throws Exception {
        // Only the three the browser suite exhausts are configurable, and deliberately so:
        // every extra knob is another way to ship production with a limit somebody loosened
        // for a test.
        assertThat(limitFor("/api/v1/auth/forgot-password", 60, 30)).isEqualTo("3");
        assertThat(limitFor("/api/v1/meal-plan/generate", 60, 30)).isEqualTo("5");
    }

    @Test
    @DisplayName("a route with no policy carries no limit headers")
    void aRouteWithNoPolicyCarriesNoLimitHeaders() throws Exception {
        assertThat(limitFor("/api/v1/dashboard", 10, 5)).isNull();
    }
}
