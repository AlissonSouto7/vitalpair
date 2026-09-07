package com.aps.vitalpair.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Properties of the Open Food Facts integration (prefix {@code vitalpair.openfoodfacts}). The
 * User-Agent is required by their API. Search by name uses Search-a-licious ({@code searchUrl}),
 * which is steadier for programmatic use than the legacy endpoint; barcode lookup uses the main
 * API ({@code baseUrl}).
 */
@ConfigurationProperties(prefix = "vitalpair.openfoodfacts")
public record OpenFoodFactsProperties(String baseUrl, String searchUrl, String userAgent) {}
