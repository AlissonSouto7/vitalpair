/**
 * Feature <b>mealvision</b>: meal analysis from a photo (Anthropic Claude, vision).
 *
 * <p>The user sends a picture of the plate and gets back the foods detected, each with an
 * estimated portion in grams and its macros. The operation is <i>stateless</i>: nothing is
 * persisted here; the meal is logged through {@code POST /logs} of the {@code nutrition}
 * feature.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (the service orchestrating the use case) and
 * {@code infrastructure} ({@code ai} with the Anthropic Feign client, {@code web} with a
 * controller separate from NutritionController). Dependency rule: infrastructure ->
 * application -> domain.
 */
package com.aps.vitalpair.mealvision;
