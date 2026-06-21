/**
 * Feature <b>gamification</b> — badges, streaks, sistema de pontos por consistência e placar semanal
 * entre o par.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence, client). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitapair.gamification;
