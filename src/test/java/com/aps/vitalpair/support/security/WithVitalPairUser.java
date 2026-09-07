package com.aps.vitalpair.support.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.security.test.context.support.WithSecurityContext;

/**
 * Runs a test as an authenticated VitalPair user.
 *
 * <p>Spring Security's {@code @WithMockUser} puts a {@code UserDetails} principal in the
 * context, but every controller here declares {@code @AuthenticationPrincipal
 * AuthenticatedUser}, so under {@code @WithMockUser} the principal resolves to null and the
 * first {@code principal.userId()} throws. This annotation installs the same principal the
 * JWT filter would, with the same {@code ROLE_} authority.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithVitalPairUserSecurityContextFactory.class)
public @interface WithVitalPairUser {

    /** Fixed so tests can assert on it. */
    String USER_ID = "11111111-1111-1111-1111-111111111111";

    String TENANT_ID = "22222222-2222-2222-2222-222222222222";

    String userId() default USER_ID;

    String tenantId() default TENANT_ID;

    String email() default "user@test.vitalpair.app";

    String role() default "USER";
}
