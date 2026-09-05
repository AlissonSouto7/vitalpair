package com.aps.vitalpair.nutrition.infrastructure.client;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.aps.vitalpair.config.OpenFoodFactsProperties;
import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import com.aps.vitalpair.nutrition.domain.port.out.OpenFoodFactsPort;

/** Adaptador da porta de busca de alimentos sobre a API pública da Open Food Facts. */
@Component
public class OpenFoodFactsAdapter implements OpenFoodFactsPort {

    private static final Logger log = LoggerFactory.getLogger(OpenFoodFactsAdapter.class);
    private static final int SEARCH_PAGE_SIZE = 20;
    private static final String FIELDS = "code,product_name,nutriments";

    private final RestClient productClient;
    private final RestClient searchClient;

    public OpenFoodFactsAdapter(OpenFoodFactsProperties properties) {
        this.productClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
        this.searchClient = RestClient.builder()
                .baseUrl(properties.searchUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    @Override
    public List<FoodProduct> searchByName(String query) {
        try {
            OffResponses.SearchResponse response = searchClient
                    .get()
                    .uri(builder -> builder.path("/search")
                            .queryParam("q", query)
                            .queryParam("page_size", SEARCH_PAGE_SIZE)
                            .queryParam("fields", FIELDS)
                            .build())
                    .retrieve()
                    .body(OffResponses.SearchResponse.class);

            if (response == null || response.hits() == null) {
                return List.of();
            }
            return response.hits().stream()
                    .filter(product -> product.productName() != null
                            && !product.productName().isBlank())
                    .map(this::toFoodProduct)
                    .toList();
        } catch (RestClientException ex) {
            log.warn("Falha ao buscar alimentos na Open Food Facts: {}", ex.getMessage());
            return List.of();
        }
    }

    @Override
    public Optional<FoodProduct> findByBarcode(String barcode) {
        try {
            OffResponses.ProductResponse response = productClient
                    .get()
                    .uri(builder -> builder.path("/api/v2/product/{barcode}.json")
                            .queryParam("fields", FIELDS)
                            .build(barcode))
                    .retrieve()
                    .body(OffResponses.ProductResponse.class);

            if (response == null
                    || response.status() != 1
                    || response.product() == null
                    || response.product().productName() == null) {
                return Optional.empty();
            }
            return Optional.of(toFoodProduct(response.product()));
        } catch (HttpClientErrorException.NotFound ex) {
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("Falha ao consultar código de barras na Open Food Facts: {}", ex.getMessage());
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

    private static BigDecimal toBigDecimal(Double value) {
        return value != null ? BigDecimal.valueOf(value) : null;
    }
}
