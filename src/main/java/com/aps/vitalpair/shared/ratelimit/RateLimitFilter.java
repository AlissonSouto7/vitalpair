package com.aps.vitalpair.shared.ratelimit;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Applies per-route request limits before a request reaches a controller.
 *
 * <p>Two kinds of endpoint need this. Authentication endpoints are unauthenticated and
 * guessable, so without a limit a password list can be worked through at network speed.
 * The AI endpoints each cost money at Anthropic, so without a limit one account, or one
 * stolen token, can run up an unbounded bill.
 *
 * <p>SecurityConfig places it after the JWT filter so the per-user policies can see who
 * is calling. It is a @Component only so Spring builds it; registering it in the security
 * chain is what decides when it runs. The
 * response reuses the standard {@link ApiResponse} envelope, because a client that suddenly
 * receives a differently-shaped body on 429 will fail to parse it.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /**
     * Limits are deliberately generous for a person and restrictive for a script.
     *
     * <p>Login at 10 a minute is far more than anyone types and far less than a useful
     * guessing rate. Password reset and resend are lower because each one sends an e-mail,
     * so the abuse is mailbox flooding as much as account guessing. Plan generation is
     * capped hourly because each call is a paid request that takes around 20 seconds.
     */
    private static final Map<String, RateLimitPolicy> POLICIES = Map.of(
            "POST /api/v1/auth/login", RateLimitPolicy.perIp("login", 10, Duration.ofMinutes(1)),
            "POST /api/v1/auth/register", RateLimitPolicy.perIp("register", 5, Duration.ofMinutes(1)),
            "POST /api/v1/auth/oauth2/google", RateLimitPolicy.perIp("google", 10, Duration.ofMinutes(1)),
            "POST /api/v1/auth/refresh", RateLimitPolicy.perIp("refresh", 30, Duration.ofMinutes(1)),
            "POST /api/v1/auth/forgot-password", RateLimitPolicy.perIp("forgot", 3, Duration.ofMinutes(10)),
            "POST /api/v1/auth/resend-verification", RateLimitPolicy.perIp("resend", 3, Duration.ofMinutes(10)),
            "POST /api/v1/nutrition/photo", RateLimitPolicy.perUser("photo", 20, Duration.ofHours(1)),
            "POST /api/v1/meal-plan/generate", RateLimitPolicy.perUser("mealplan", 5, Duration.ofHours(1)),
            "POST /api/v1/workout-plan/generate", RateLimitPolicy.perUser("workoutplan", 5, Duration.ofHours(1)),
            "POST /api/v1/meal-plan/swap", RateLimitPolicy.perUser("mealswap", 20, Duration.ofHours(1)));

    private final RateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimiter rateLimiter, ObjectMapper objectMapper) {
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        RateLimitPolicy policy = POLICIES.get(request.getMethod() + " " + request.getRequestURI());
        if (policy == null) {
            chain.doFilter(request, response);
            return;
        }

        String identity = identify(request, policy);
        RateLimitResult result = rateLimiter.check(policy, identity);

        response.setHeader("X-RateLimit-Limit", String.valueOf(policy.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));

        if (result.allowed()) {
            chain.doFilter(request, response);
            return;
        }

        writeTooManyRequests(request, response, result.retryAfter());
    }

    /**
     * Resolves who is calling: the authenticated user when the policy is per-user, the
     * client IP otherwise.
     *
     * <p>A per-user policy that finds no authenticated user falls back to the IP rather
     * than to a shared bucket. Without that, every anonymous caller would share one
     * allowance and the first of them would lock out the rest.
     */
    private String identify(HttpServletRequest request, RateLimitPolicy policy) {
        if (policy.perUser()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser user) {
                return "user:" + user.userId();
            }
        }
        return "ip:" + request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletRequest request, HttpServletResponse response, Duration retryAfter)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter.toSeconds()));

        ApiError error = new ApiError(
                Instant.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                request.getRequestURI(),
                List.of());
        ApiResponse<ApiError> body = ApiResponse.fail(
                "Muitas tentativas. Tente de novo em %d segundos.".formatted(retryAfter.toSeconds()), error);

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
