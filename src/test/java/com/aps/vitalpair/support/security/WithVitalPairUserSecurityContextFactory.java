package com.aps.vitalpair.support.security;

import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import com.aps.vitalpair.shared.security.AuthenticatedUser;
import com.aps.vitalpair.shared.security.Role;

/** Builds the security context for {@link WithVitalPairUser}, mirroring the JWT filter. */
public class WithVitalPairUserSecurityContextFactory implements WithSecurityContextFactory<WithVitalPairUser> {

    @Override
    public SecurityContext createSecurityContext(WithVitalPairUser annotation) {
        Role role = Role.valueOf(annotation.role());
        AuthenticatedUser principal = new AuthenticatedUser(
                UUID.fromString(annotation.userId()), UUID.fromString(annotation.tenantId()), annotation.email(), role);
        var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        return context;
    }
}
