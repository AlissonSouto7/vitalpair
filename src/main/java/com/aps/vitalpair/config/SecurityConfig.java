package com.aps.vitalpair.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.aps.vitalpair.auth.infrastructure.security.JwtAuthenticationFilter;
import com.aps.vitalpair.shared.ratelimit.RateLimitFilter;

/** Configuração de segurança: stateless, JWT, CORS e rotas públicas vs protegidas. */
@Configuration
// Enables @PreAuthorize. Without it the annotation is silently ignored, which is the
// dangerous failure mode: the endpoint looks guarded and is not.
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = {
        "/api/v1/auth/**", "/actuator/health", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
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
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // CSRF protection defends session cookies, which the browser attaches to a
        // cross-site request automatically. This API keeps no session
        // (SessionCreationPolicy.STATELESS) and authenticates from the Authorization
        // header, which a cross-site request cannot set. There is no ambient credential
        // to abuse, so the protection has nothing to protect and only breaks clients.
        //
        // This must be revisited if authentication ever moves to a cookie. Phase 6 of the
        // professionalization plan proposes exactly that for the refresh token, and CSRF
        // defences have to come back with it: SameSite=Strict, a path-scoped cookie, and
        // JSON-only endpoints.
        //
        // CodeQL reports this as java/spring-disabled-csrf-protection. Dismissed as a
        // false positive for a stateless API; see the pull request that added this comment.
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(PUBLIC_PATHS)
                        .permitAll()
                        // Prévia pública do convite: só leitura, exibida antes de o convidado ter conta.
                        .requestMatchers(HttpMethod.GET, "/api/v1/pair/invite/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(unauthorizedEntryPoint()))
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

    private AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, ex) -> response.sendError(HttpStatus.UNAUTHORIZED.value(), "Não autenticado");
    }
}
