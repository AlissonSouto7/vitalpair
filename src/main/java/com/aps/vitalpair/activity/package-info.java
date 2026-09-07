/**
 * Feature <b>activity</b>: steps, runs and workouts, logged by hand with calories computed or
 * estimated. The source enum already names the wearables (WeWard, Google Fit, Strava) so their
 * data can be imported later; no integration exists yet.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (use cases), {@code infrastructure} (web, persistence).
 * Dependency rule: infrastructure -> application -> domain.
 */
package com.aps.vitalpair.activity;
