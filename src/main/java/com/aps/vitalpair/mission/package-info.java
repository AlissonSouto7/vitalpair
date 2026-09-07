/**
 * Feature <b>mission</b>: the day's flash mission per pair, and the weekly missions whose
 * progress is counted live from the real logs. A catalogue of missions plus each pair's daily
 * acceptance state.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (use cases), {@code infrastructure} (web,
 * persistence). Dependency rule: infrastructure -> application -> domain.
 */
package com.aps.vitalpair.mission;
