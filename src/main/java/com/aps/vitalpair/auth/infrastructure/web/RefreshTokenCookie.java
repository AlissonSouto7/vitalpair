package com.aps.vitalpair.auth.infrastructure.web;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Builds the cookie that carries the refresh token.
 *
 * <p>The refresh token used to travel in the response body and live in localStorage, where
 * any script on the page can read it. That is the whole prize of an XSS on this app: the
 * access token expires in fifteen minutes, but a stolen refresh token renews itself for
 * thirty days. In an HttpOnly cookie, script cannot read it at all.
 *
 * <p>The attributes are what make it work:
 *
 * <ul>
 *   <li><b>HttpOnly</b> keeps it out of reach of JavaScript, which is the entire point
 *   <li><b>Secure</b> stops it travelling over plain HTTP; disabled only in development,
 *       where there is no TLS
 *   <li><b>SameSite=Strict</b> means the browser never attaches it to a cross-site request,
 *       which is what makes disabling CSRF protection safe for this endpoint
 *   <li><b>Path</b> scoped to the auth routes, so it is not sent on every API call; a
 *       credential that travels only where it is needed is exposed in fewer places
 * </ul>
 */
@Component
public class RefreshTokenCookie {

    public static final String NAME = "vp_refresh";

    private static final String PATH = "/api/v1/auth";

    private final boolean secure;
    private final Duration maxAge;

    public RefreshTokenCookie(
            @Value("${vitalpair.auth.cookie-secure:true}") boolean secure,
            @Value("${vitalpair.jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.secure = secure;
        this.maxAge = Duration.ofMillis(refreshExpirationMs);
    }

    /** Cookie carrying a freshly issued refresh token. */
    public ResponseCookie issue(String refreshToken) {
        return base(refreshToken).maxAge(maxAge).build();
    }

    /**
     * Cookie that clears the stored one.
     *
     * <p>Every attribute must match the original, otherwise the browser treats it as a
     * different cookie and the old one stays put.
     */
    public ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(PATH);
    }
}
