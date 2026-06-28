/**
 * Feature <b>auth</b> — autenticação e autorização: registro, login, emissão/renovação de JWT,
 * logout (revogação no Redis) e OAuth2 (Google/Apple).
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence, client). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.auth;
