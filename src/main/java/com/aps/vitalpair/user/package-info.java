/**
 * Feature <b>user</b>: the user profile (personal data, goal, activity level) and its computed
 * calorie and macro targets. Exposes {@code /users/me} and {@code /users/me/tdee}.
 *
 * <p>Hexagonal layout (see {@code docs/adr/0001-arquitetura-hexagonal.md}): {@code domain}
 * (model and ports), {@code application} (use cases), {@code infrastructure} (web,
 * persistence). Dependency rule: infrastructure -> application -> domain.
 */
package com.aps.vitalpair.user;
