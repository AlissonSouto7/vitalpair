/**
 * Feature <b>tdee</b>: BMR (Mifflin-St Jeor), TDEE and the macro targets by goal.
 *
 * <p>A <b>domain service</b>, consumed by {@code user} when the profile is saved or updated.
 * Having neither persistence nor an API of its own, it materialises only {@code domain} (the
 * calculation rules) and {@code application} (the use case). See
 * {@code docs/adr/0001-arquitetura-hexagonal.md}.
 */
package com.aps.vitalpair.tdee;
