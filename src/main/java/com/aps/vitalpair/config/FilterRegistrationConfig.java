package com.aps.vitalpair.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.aps.vitalpair.auth.infrastructure.security.JwtAuthenticationFilter;
import com.aps.vitalpair.shared.ratelimit.RateLimitFilter;

/**
 * Stops Spring Boot from registering security filters twice.
 *
 * <p>A {@code Filter} that is also a {@code @Component} gets picked up by the servlet
 * container automatically, on top of its place in the security chain. Both of ours are
 * components, so both were running twice per request.
 *
 * <p>For the JWT filter that was merely wasteful: parsing the same token twice produces the
 * same result. For the rate limiter it would be a real defect, since each request would be
 * counted twice and every limit would be effectively halved. Worse, the servlet-level
 * registration runs before authentication, so a per-user policy would see no user and fall
 * back to the IP, mixing two different counting strategies for the same endpoint.
 *
 * <p>Registering them here with {@code setEnabled(false)} keeps the servlet container out of
 * it. SecurityConfig remains the only place that decides when these filters run.
 */
@Configuration
public class FilterRegistrationConfig {

    @Bean
    FilterRegistrationBean<JwtAuthenticationFilter> disableJwtFilterAutoRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    FilterRegistrationBean<RateLimitFilter> disableRateLimitFilterAutoRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
