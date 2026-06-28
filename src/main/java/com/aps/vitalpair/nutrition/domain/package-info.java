/**
 * Núcleo da feature nutrition: modelo de domínio e portas. <b>Sem dependência de Spring/JPA/Jackson.</b>
 *
 * <ul>
 *   <li>{@code model} — entidades de domínio e value objects (FoodLog, Meal).</li>
 *   <li>{@code port.in} — interfaces dos casos de uso (entrada do hexágono).</li>
 *   <li>{@code port.out} — interfaces de gateways (persistência, Open Food Facts).</li>
 * </ul>
 */
package com.aps.vitalpair.nutrition.domain;
