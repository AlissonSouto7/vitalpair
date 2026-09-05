package com.aps.vitalpair.auth.infrastructure.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.tenant.TenantContext;

/**
 * Valida o access token (Bearer) em cada requisição, popula o SecurityContext e o
 * {@link TenantContext} com o tenant do token. Limpa o TenantContext ao final da requisição.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final TokenProviderPort tokenProvider;

    public JwtAuthenticationFilter(TokenProviderPort tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            extractToken(request).flatMap(tokenProvider::parseAccessToken).ifPresent(payload -> {
                AuthenticatedUser principal =
                        new AuthenticatedUser(payload.userId(), payload.tenantId(), payload.email(), payload.role());
                // Spring Security expects the ROLE_ prefix: hasRole("ADMIN") looks for an
                // authority literally named ROLE_ADMIN. Without it the check silently never
                // matches, which fails closed but is baffling to debug.
                var authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + payload.role().name()));
                var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                TenantContext.set(payload.tenantId());
            });
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private java.util.Optional<String> extractToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return java.util.Optional.of(header.substring(BEARER_PREFIX.length()));
        }
        return java.util.Optional.empty();
    }
}
