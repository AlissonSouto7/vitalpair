/**
 * Feature <b>pair</b> — o par é o <i>tenant</i> do sistema: convite por código, aceitação,
 * relacionamento entre os dois usuários, feed compartilhado e placar da competição.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence, client). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.pair;
