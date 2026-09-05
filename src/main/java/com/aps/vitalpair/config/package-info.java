/**
 * Cross-cutting application configuration: infrastructure beans and typed
 * configuration properties. No business rules live here.
 *
 * <p>Holds {@link com.aps.vitalpair.config.SecurityConfig} (filter chain, CORS, public
 * routes), {@link com.aps.vitalpair.config.OpenApiConfig}, and the
 * {@code @ConfigurationProperties} records that bind the {@code vitalpair.*} namespace.
 *
 * <p>Configuration that belongs to a single feature stays inside that feature's
 * {@code infrastructure} package instead, so it can be read next to the code it affects.
 * The Anthropic Feign client configurations are the example: they are deliberately not
 * {@code @Configuration} classes, which keeps them scoped to their own client.
 */
package com.aps.vitalpair.config;
