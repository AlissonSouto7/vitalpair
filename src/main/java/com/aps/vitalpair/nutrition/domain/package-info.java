/**
 * The core of the nutrition feature: domain model and ports. <b>No dependency on Spring, JPA or
 * Jackson.</b>
 *
 * <ul>
 *   <li>{@code model}: domain entities and value objects (FoodLog, FavoriteFood).</li>
 *   <li>{@code port.in}: the use case interfaces (the way into the hexagon).</li>
 *   <li>{@code port.out}: the gateway interfaces (persistence, Open Food Facts).</li>
 * </ul>
 */
package com.aps.vitalpair.nutrition.domain;
