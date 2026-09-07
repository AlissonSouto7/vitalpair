/**
 * Feature <b>auth</b>: authentication and authorisation. Registration, login, issuing and
 * renewing the JWT, logout (revocation in Redis), Google sign-in, e-mail verification and
 * password reset.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (use cases), {@code infrastructure} (web, persistence,
 * mail, security). Dependency rule: infrastructure -> application -> domain.
 */
package com.aps.vitalpair.auth;
