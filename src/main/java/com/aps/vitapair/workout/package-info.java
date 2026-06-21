/**
 * Feature <b>workout</b> — planos de treino (manuais ou gerados por IA), exercícios e registro de
 * sessões realizadas com calorias gastas.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence, client). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitapair.workout;
