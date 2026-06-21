package com.aps.vitapair.nutrition.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** DTOs de resposta da Open Food Facts (apenas os campos usados). */
final class OffResponses {

    private OffResponses() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Nutriments(
            @JsonProperty("energy-kcal_100g") Double energyKcal100g,
            @JsonProperty("proteins_100g") Double proteins100g,
            @JsonProperty("carbohydrates_100g") Double carbohydrates100g,
            @JsonProperty("fat_100g") Double fat100g) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Product(
            @JsonProperty("product_name") String productName,
            String code,
            Nutriments nutriments) {
    }

    /** Resposta da Search-a-licious (search.openfoodfacts.org). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record SearchResponse(List<Product> hits) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ProductResponse(int status, Product product) {
    }
}
