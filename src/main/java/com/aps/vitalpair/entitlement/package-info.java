/**
 * Who may use what: the paid features and who has access to them.
 *
 * <p>Its own feature rather than a corner of {@code user} because the answer depends on two
 * others, the person's plan and their pair, and the features that ask ({@code ai},
 * {@code mealvision}) must not reach into either. This package reads the published output
 * ports of {@code user} and {@code pair} and exposes one input port; nothing imports it back,
 * which is what keeps it out of the frozen feature cycles.
 */
package com.aps.vitalpair.entitlement;
