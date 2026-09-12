package com.aps.vitalpair.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.aps.vitalpair.auth.infrastructure.security.JwtAuthenticationFilter;
import com.aps.vitalpair.shared.ratelimit.RateLimitFilter;
import com.aps.vitalpair.shared.web.JsonAuthenticationEntryPoint;

/** Security configuration: stateless, JWT, CORS, and which routes are public. */
@Configuration
// Enables @PreAuthorize. Without it the annotation is silently ignored, which is the
// dangerous failure mode: the endpoint looks guarded and is not.
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = {
        "/api/v1/auth/**", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${vitalpair.cors.allowed-origins}")
    private List<String> allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JsonAuthenticationEntryPoint entryPoint) throws Exception {
        // CSRF protection defends session cookies, which the browser attaches to a
        // cross-site request automatically. This API keeps no session
        // (SessionCreationPolicy.STATELESS) and authenticates from the Authorization
        // header, which a cross-site request cannot set. There is no ambient credential
        // to abuse, so the protection has nothing to protect and only breaks clients.
        //
        // The refresh token IS in a cookie, and this comment used to talk
        // about that as a future thing to worry about. The defences it named came with it
        // and are what keep this decision sound: SameSite=Strict (so no cross-site request
        // carries the cookie at all), Secure, HttpOnly, and a path scoped to
        // /api/v1/auth, which is the only place it is ever read. See RefreshTokenCookie.
        //
        // What would change this: widening that cookie's path, dropping SameSite, or
        // authenticating an ordinary endpoint from a cookie rather than the header. Any of
        // those brings the ambient credential back and CSRF tokens with it.
        //
        // CodeQL reports this as java/spring-disabled-csrf-protection and it is dismissed
        // as a false positive on the alert itself, with the same reasoning.
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(PUBLIC_PATHS)
                        .permitAll()
                        // Actuator is served on the management port (9090), which the reverse
                        // proxy never maps, so reaching it at all means being inside the
                        // network. This chain applies to every port the application listens
                        // on, so without this the metrics endpoint answers 401 to a scraper
                        // running beside it: protection nobody asked for, and an outage
                        // nobody sees. Matched by path rather than by EndpointRequest, which
                        // resolves against the servlet context of the main port and does not
                        // match the same paths on the management port.
                        .requestMatchers("/actuator/**")
                        .permitAll()
                        // Public invite preview: read only, shown before the guest has an account.
                        .requestMatchers(HttpMethod.GET, "/api/v1/pair/invite/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // After authentication on purpose: the per-user policies need to know who is
                // calling. Registered here rather than left as a servlet filter, because a
                // plain @Component filter runs before the security chain, where the security
                // context is still empty and every caller would be counted by IP.
                .addFilterAfter(rateLimitFilter, JwtAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
