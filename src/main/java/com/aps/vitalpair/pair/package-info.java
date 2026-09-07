/**
 * Feature <b>pair</b>: the pair is the system's <i>tenant</i>. Invite by code, acceptance, the
 * relationship between the two users, and the tenant move that joining implies.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (use cases), {@code infrastructure} (web,
 * persistence). Dependency rule: infrastructure -> application -> domain.
 */
package com.aps.vitalpair.pair;
