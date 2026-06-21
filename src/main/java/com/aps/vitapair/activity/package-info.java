/**
 * Feature <b>activity</b> — passos, corridas e treinos: registro manual e cálculo de calorias gastas,
 * além da integração com wearables (WeWard, Google Fit, Strava) via OAuth2.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence, client). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitapair.activity;
