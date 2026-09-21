package com.aps.vitalpair.nutrition.infrastructure.client;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import com.aps.vitalpair.nutrition.domain.port.out.OpenFoodFactsPort;

/**
 * Adapter of the food search port over the public Open Food Facts API.
 *
 * <p>The HTTP call, with its retry and circuit breaker, lives in {@link OpenFoodFactsHttpClient}.
 * This class translates to the domain and decides to degrade: any failure becomes an empty
 * list or {@code Optional.empty()}, because a search box with no results beats an error screen
 * caused by a free service nobody controls.
 */
@Component
public class OpenFoodFactsAdapter implements OpenFoodFactsPort {

    private static final Logger log = LoggerFactory.getLogger(OpenFoodFactsAdapter.class);

    private final OpenFoodFactsHttpClient http;

    public OpenFoodFactsAdapter(OpenFoodFactsHttpClient http) {
        this.http = http;
    }

    @Override
    public List<FoodProduct> searchByName(String query) {
        try {
            OffResponses.SearchResponse response = http.search(query);
            if (response == null || response.hits() == null) {
                return List.of();
            }
            return response.hits().stream()
                    .filter(product -> product.productName() != null
                            && !product.productName().isBlank())
                    .map(this::toFoodProduct)
                    .toList();
        } catch (RuntimeException ex) {
            // Includes CallNotPermittedException, thrown when the breaker is open.
            log.warn("Falha ao buscar alimentos na Open Food Facts: {}", ex.getMessage(), ex);
            return List.of();
        }
    }

    @Override
    public Optional<FoodProduct> findByBarcode(String barcode) {
        try {
            OffResponses.ProductResponse response = http.product(barcode);
            if (response == null
                    || response.status() != 1
                    || response.product() == null
                    || response.product().productName() == null) {
                return Optional.empty();
            }
            return Optional.of(toFoodProduct(response.product()));
        } catch (HttpClientErrorException.NotFound ex) {
            return Optional.empty();
        } catch (RuntimeException ex) {
            log.warn("Falha ao consultar código de barras na Open Food Facts: {}", ex.getMessage(), ex);
            return Optional.empty();
        }
    }

    private FoodProduct toFoodProduct(OffResponses.Product product) {
        OffResponses.Nutriments n = product.nutriments();
        return new FoodProduct(
                product.productName(),
                product.code(),
                toBigDecimal(n != null ? n.energyKcal100g() : null),
                toBigDecimal(n != null ? n.proteins100g() : null),
                toBigDecimal(n != null ? n.carbohydrates100g() : null),
                toBigDecimal(n != null ? n.fat100g() : null));
    }

    /**
     * One decimal place, which is all a food label ever carries.
     *
     * <p>Open Food Facts sends these as JSON numbers that arrive as a double, and
     * {@code BigDecimal.valueOf(double)} faithfully preserves the binary rounding error that
     * comes with them. So a bread whose label says 1.2 g of protein reached the screen as
     * {@code 1.2000000476837158}, inside an editable field, and a search result read
     * "76.5999984741211 kcal". Measured against the live API on 21/09/2026: 2 of the 20
     * results for "pao" came back like that.
     *
     * <p>Rounded here, at the boundary where the foreign number enters, rather than in each
     * screen that shows it: the value is stored and recalculated per portion downstream, so
     * rounding late would leave the error in the database and in every arithmetic it feeds.
     * HALF_UP because this is a quantity a person reads, not an accounting figure.
     */
    private static BigDecimal toBigDecimal(Double value) {
        return value != null ? BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP) : null;
    }
}
