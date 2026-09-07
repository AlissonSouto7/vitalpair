/**
 * External client adapter of nutrition: {@code OpenFoodFactsHttpClient} (RestClient, with
 * timeouts, retry and circuit breaker) and {@code OpenFoodFactsAdapter}, which implements the
 * food search port and degrades to empty results on failure. The User-Agent their API requires
 * is set here.
 */
package com.aps.vitalpair.nutrition.infrastructure.client;
