/**
 * Feature <b>user</b> — perfil do usuário (dados pessoais, objetivo, nível de atividade) e suas metas
 * calóricas/macros calculadas. Expõe {@code /me} e estatísticas do usuário.
 *
 * <p>Organização hexagonal (ver {@code docs/adr/0001-arquitetura-hexagonal.md}):
 * {@code domain} (modelo + portas), {@code application} (casos de uso), {@code infrastructure}
 * (web, persistence, client). Regra de dependência: infrastructure → application → domain.
 */
package com.aps.vitalpair.user;
