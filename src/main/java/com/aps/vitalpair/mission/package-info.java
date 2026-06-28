/**
 * Feature <b>mission</b> — missão relâmpago do dia por par. Catálogo de missões e o estado diário
 * (aceita ou não) de cada par.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.mission;
