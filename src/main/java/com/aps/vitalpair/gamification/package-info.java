/**
 * Feature <b>gamification</b>: badges, streaks, points for consistency and the weekly scoreboard
 * between the two members of a pair.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (use cases and the event listener),
 * {@code infrastructure} (web, persistence). Dependency rule: infrastructure -> application ->
 * domain.
 */
package com.aps.vitalpair.gamification;
