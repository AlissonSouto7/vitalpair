package com.aps.vitalpair.nutrition.infrastructure.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTOs of Open Food Facts, only the fields used.
 *
 * <p>Public because they appear in the signature of {@link OpenFoodFactsHttpClient}, which has
 * to be a bean of its own for the resilience proxy to work.
 */
public final class OffResponses {

    private OffResponses() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Nutriments(
            @JsonProperty("energy-kcal_100g") Double energyKcal100g,
            @JsonProperty("proteins_100g") Double proteins100g,
            @JsonProperty("carbohydrates_100g") Double carbohydrates100g,
            @JsonProperty("fat_100g") Double fat100g) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Product(@JsonProperty("product_name") String productName, String code, Nutriments nutriments) {}

    /** Resposta da Search-a-licious (search.openfoodfacts.org). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SearchResponse(List<Product> hits) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProductResponse(int status, Product product) {}
}
