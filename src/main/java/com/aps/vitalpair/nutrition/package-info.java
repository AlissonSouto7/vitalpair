/**
 * Feature <b>nutrition</b>: logging meals (from Open Food Facts or by hand) and the daily
 * nutrition summary (calories and macros consumed against the target).
 *
 * <p><b>The reference feature</b>: it materialises the full hexagonal tree so the others can
 * follow it. See {@code docs/adr/0001-arquitetura-hexagonal.md}. Dependency rule: infrastructure
 * -> application -> domain.
 */
package com.aps.vitalpair.nutrition;
